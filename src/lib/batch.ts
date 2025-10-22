import { analyse, type AnalysisResult } from '@/lib/analyzer';

export type BatchItem = {
  idLabel: string;
  raw: string;
  analysis: AnalysisResult;
};

export type BatchSummary = {
  count: number;
  validCount: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  byRequestType: Record<string, number>;
  byPlatform: Record<string, number>;
  byDeviceType: Record<string, number>;
  currencies: string[];
  supplyNodesMinMax?: { min: number; max: number } | undefined;
};

export type BatchOutput = {
  items: BatchItem[];
  summary: BatchSummary;
  notices: string[];
  skipped: string[];
};

// Robust segmenter to split concatenated JSON objects
export function segmentJsonObjects(input: string): string[] {
  // Normalize
  const s = input.replace(/^\uFEFF/, ''); // strip BOM
  const out: string[] = [];
  let depth = 0, start = -1, inStr = false, esc = false;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (esc) { esc = false; }
      else if (ch === '\\') { esc = true; }
      else if (ch === '"') { inStr = false; }
      continue;
    }
    if (ch === '"') { inStr = true; continue; }
    if (ch === '{') { if (depth++ === 0) start = i; continue; }
    if (ch === '}') {
      if (--depth === 0 && start >= 0) {
        out.push(s.slice(start, i + 1));
        start = -1;
      }
      continue;
    }
  }
  return out;
}

function isBidRequest(o: any): boolean {
  return !!o && typeof o.id === 'string' && Array.isArray(o.imp);
}

function isBidResponse(o: any): boolean {
  return !!o && typeof o.id === 'string' && Array.isArray(o.seatbid);
}

export function parseMultiInput(input: string): string[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  // 1) JSON array
  if (trimmed.startsWith('[')) {
    try {
      const arr = JSON.parse(trimmed);
      if (Array.isArray(arr)) return arr.map(x => JSON.stringify(x));
    } catch {/* fallthrough */}
  }

  // 2) Blocks separated by '---'
  const byDashes = trimmed.split(/\n\s*---\s*\n/g).map(b => b.trim()).filter(Boolean);
  if (byDashes.length > 1) return byDashes;

  // 3) NDJSON (one JSON per non-empty line)
  const ndjson = trimmed.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (ndjson.length > 1 && ndjson.every(l => l.startsWith('{') && l.endsWith('}'))) return ndjson;

  // 4) Concatenated JSON objects: {..}{..}{..}
  const segmented = segmentJsonObjects(trimmed);
  if (segmented.length > 0) return segmented;

  // Fallback: try single object
  return [trimmed];
}

export function analyseBatch(raws: string[], limit = 10): BatchOutput {
  const items: BatchItem[] = [];
  const skipped: string[] = [];
  const notices: string[] = [];
  const seenIds = new Map<string, number>();

  if (raws.length > limit) notices.push(`Limit ${limit} applied, ${raws.length - limit} ignored.`);
  const slice = raws.slice(0, limit);

  for (let i = 0; i < slice.length; i++) {
    const raw = slice[i];
    let obj: any;
    try { obj = JSON.parse(raw); } catch (e: any) {
      skipped.push(`Item ${i + 1}: invalid JSON (${e.message})`);
      continue;
    }

    // Identify type
    if (isBidResponse(obj)) {
      skipped.push(`Item ${i + 1}: detected Bid Response (seatbid) — skipped`);
      continue;
    }
    if (!isBidRequest(obj)) {
      skipped.push(`Item ${i + 1}: not an OpenRTB Bid Request — skipped`);
      continue;
    }

    // Label by top-level id, with dedupe suffix if repeated
    const base = String(obj.id || `req-${i + 1}`);
    const n = (seenIds.get(base) || 0) + 1;
    seenIds.set(base, n);
    const idLabel = n > 1 ? `${base}#${n}` : base;

    const analysis = analyse(raw);
    items.push({ idLabel, raw, analysis });
  }

  // Aggregate
  const summary: BatchSummary = {
    count: items.length,
    validCount: items.filter(x => !x.analysis.issues.some(i => i.severity === 'error')).length,
    errorCount: items.reduce((a, x) => a + x.analysis.issues.filter(i => i.severity === 'error').length, 0),
    warningCount: items.reduce((a, x) => a + x.analysis.issues.filter(i => i.severity === 'warning').length, 0),
    infoCount: items.reduce((a, x) => a + x.analysis.issues.filter(i => i.severity === 'info').length, 0),
    byRequestType: {}, byPlatform: {}, byDeviceType: {}, currencies: [],
    supplyNodesMinMax: undefined,
  };

  const curSet = new Set<string>();
  let minNodes = Number.POSITIVE_INFINITY, maxNodes = 0;

  for (const it of items) {
    const s = it.analysis.summary;
    summary.byRequestType[s.requestType] = (summary.byRequestType[s.requestType] || 0) + 1;
    summary.byPlatform[s.platform] = (summary.byPlatform[s.platform] || 0) + 1;
    summary.byDeviceType[s.deviceType] = (summary.byDeviceType[s.deviceType] || 0) + 1;

    const cur = (it.analysis.request?.cur ?? undefined);
    if (typeof cur === 'string') curSet.add(cur);
    else if (Array.isArray(cur)) cur.forEach((c: string) => curSet.add(c));

    const nodes = it.analysis.request?.source?.schain?.nodes;
    if (Array.isArray(nodes)) {
      minNodes = Math.min(minNodes, nodes.length);
      maxNodes = Math.max(maxNodes, nodes.length);
    }
  }
  summary.currencies = Array.from(curSet).sort();
  if (minNodes !== Number.POSITIVE_INFINITY) summary.supplyNodesMinMax = { min: minNodes, max: maxNodes };

  return { items, summary, notices, skipped };
}
