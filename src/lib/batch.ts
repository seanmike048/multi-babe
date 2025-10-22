import { analyse, type AnalysisResult } from '@/lib/analyzer';

export type BatchItem = {
  id: string;
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

export function parseMultiInput(input: string): string[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  // Format 1: JSON array
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item) => item && typeof item === 'object')
          .map((item) => JSON.stringify(item));
      }
    } catch {
      // Fall through to other formats
    }
  }

  // Format 2: --- delimiter
  const delimiterPattern = /^---\s*$/gm;
  if (delimiterPattern.test(trimmed)) {
    const blocks = trimmed.split(delimiterPattern);
    const results: string[] = [];
    
    for (const block of blocks) {
      const cleaned = block.trim();
      if (!cleaned) continue;
      
      try {
        JSON.parse(cleaned); // Validate JSON
        results.push(cleaned);
      } catch {
        // Skip invalid blocks
      }
    }
    
    if (results.length > 0) return results;
  }

  // Format 3: NDJSON (one JSON per line)
  const lines = trimmed.split('\n');
  const results: string[] = [];
  
  for (const line of lines) {
    const cleaned = line.trim();
    if (!cleaned) continue;
    
    try {
      JSON.parse(cleaned); // Validate JSON
      results.push(cleaned);
    } catch {
      // Skip invalid lines
    }
  }

  return results;
}

export function analyseBatch(
  raws: string[],
  limit = 10
): {
  items: BatchItem[];
  summary: BatchSummary;
  notices: string[];
} {
  const notices: string[] = [];
  const sliced = raws.slice(0, limit);
  
  if (raws.length > limit) {
    const overage = raws.length - limit;
    notices.push(`Limit ${limit} applied, ${overage} ignored.`);
  }

  // Run analysis on each
  const items: BatchItem[] = sliced.map((raw, idx) => ({
    id: String(idx + 1),
    raw,
    analysis: analyse(raw),
  }));

  // Aggregate summary
  const summary: BatchSummary = {
    count: items.length,
    validCount: 0,
    errorCount: 0,
    warningCount: 0,
    infoCount: 0,
    byRequestType: {},
    byPlatform: {},
    byDeviceType: {},
    currencies: [],
    supplyNodesMinMax: undefined,
  };

  const currencySet = new Set<string>();
  const schainNodes: number[] = [];

  for (const item of items) {
    const { analysis } = item;
    
    if (!analysis.error && analysis.issues) {
      // Check if valid (no errors)
      const hasError = analysis.issues.some((issue) => issue.severity === 'error');
      if (!hasError) {
        summary.validCount++;
      }

      // Count issues
      for (const issue of analysis.issues) {
        if (issue.severity === 'error') summary.errorCount++;
        else if (issue.severity === 'warning') summary.warningCount++;
        else if (issue.severity === 'info') summary.infoCount++;
      }
    }

    // Aggregate request type
    if (analysis.summary?.requestType) {
      const rt = analysis.summary.requestType;
      summary.byRequestType[rt] = (summary.byRequestType[rt] || 0) + 1;
    }

    // Aggregate platform
    if (analysis.summary?.platform) {
      const platform = analysis.summary.platform;
      summary.byPlatform[platform] = (summary.byPlatform[platform] || 0) + 1;
    }

    // Aggregate device type
    if (analysis.summary?.deviceType) {
      const device = analysis.summary.deviceType;
      summary.byDeviceType[device] = (summary.byDeviceType[device] || 0) + 1;
    }

    // Extract currencies
    try {
      const parsed = JSON.parse(item.raw);
      if (parsed.cur) {
        const currencies = Array.isArray(parsed.cur) ? parsed.cur : [parsed.cur];
        currencies.forEach((c: string) => currencySet.add(c));
      }
      // Also check impression-level
      if (parsed.imp && Array.isArray(parsed.imp)) {
        for (const imp of parsed.imp) {
          if (imp.bidfloorcur) {
            currencySet.add(imp.bidfloorcur);
          }
        }
      }

      // Extract supply chain nodes
      if (parsed.source?.schain?.nodes && Array.isArray(parsed.source.schain.nodes)) {
        schainNodes.push(parsed.source.schain.nodes.length);
      }
    } catch {
      // Skip if can't parse
    }
  }

  // Finalize currencies
  summary.currencies = Array.from(currencySet).sort();

  // Finalize supply chain min/max
  if (schainNodes.length > 0) {
    summary.supplyNodesMinMax = {
      min: Math.min(...schainNodes),
      max: Math.max(...schainNodes),
    };
  }

  return { items, summary, notices };
}
