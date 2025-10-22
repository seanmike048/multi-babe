import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BatchSummary } from '@/lib/batch';
import { AlertTriangle, XCircle, Info, CheckCircle } from 'lucide-react';

interface SummaryCardProps {
  summary: BatchSummary;
  notices: string[];
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ summary, notices }) => {
  const topDeviceTypes = Object.entries(summary.byDeviceType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <Card className="bg-slate-900 border-slate-800 w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-white font-semibold">Batch Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Notices */}
        {notices.length > 0 && (
          <div className="bg-blue-900/20 border-l-4 border-l-blue-500 p-3 rounded-md">
            {notices.map((notice, idx) => (
              <p key={idx} className="text-sm text-blue-300">
                {notice}
              </p>
            ))}
          </div>
        )}

        {/* Counts */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-sm text-slate-400">Total Analyzed</p>
            <p className="font-semibold text-xl text-white">{summary.count}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Valid</p>
            <p className="font-semibold text-xl text-green-400">{summary.validCount}</p>
          </div>
        </div>

        <Separator className="bg-slate-700" />

        {/* Issue Counts */}
        <div>
          <p className="text-sm text-slate-400 mb-2">Issues</p>
          <div className="flex flex-wrap gap-2">
            {summary.errorCount > 0 && (
              <Badge className="bg-red-900/50 text-red-300 border-red-700/60 flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" />
                {summary.errorCount} Errors
              </Badge>
            )}
            {summary.warningCount > 0 && (
              <Badge className="bg-orange-900/50 text-orange-300 border-orange-700/60 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                {summary.warningCount} Warnings
              </Badge>
            )}
            {summary.infoCount > 0 && (
              <Badge className="bg-blue-900/50 text-blue-300 border-blue-700/60 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                {summary.infoCount} Info
              </Badge>
            )}
            {summary.errorCount === 0 && summary.warningCount === 0 && summary.infoCount === 0 && (
              <Badge className="bg-green-900/50 text-green-300 border-green-700/60 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                No Issues
              </Badge>
            )}
          </div>
        </div>

        <Separator className="bg-slate-700" />

        {/* Media Types */}
        {Object.keys(summary.byRequestType).length > 0 && (
          <div>
            <p className="text-sm text-slate-400 mb-2">Media Types</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary.byRequestType).map(([type, count]) => (
                <Badge
                  key={type}
                  variant="outline"
                  className="border-slate-700 bg-slate-800 text-slate-300"
                >
                  {type}: {count}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Platforms */}
        {Object.keys(summary.byPlatform).length > 0 && (
          <div>
            <p className="text-sm text-slate-400 mb-2">Platforms</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary.byPlatform).map(([platform, count]) => (
                <Badge
                  key={platform}
                  variant="outline"
                  className="border-slate-700 bg-slate-800 text-slate-300"
                >
                  {platform}: {count}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Device Types */}
        {topDeviceTypes.length > 0 && (
          <div>
            <p className="text-sm text-slate-400 mb-2">Top Device Types</p>
            <div className="flex flex-wrap gap-2">
              {topDeviceTypes.map(([device, count]) => (
                <Badge
                  key={device}
                  variant="outline"
                  className="border-slate-700 bg-slate-800 text-slate-300"
                >
                  {device}: {count}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Currencies */}
        {summary.currencies.length > 0 && (
          <div>
            <p className="text-sm text-slate-400 mb-1">Currencies</p>
            <p className="font-semibold text-base text-white">
              {summary.currencies.join(', ')}
            </p>
          </div>
        )}

        {/* Supply Chain */}
        {summary.supplyNodesMinMax && (
          <div>
            <p className="text-sm text-slate-400 mb-1">Supply Chain Nodes</p>
            <p className="font-semibold text-base text-white">
              {summary.supplyNodesMinMax.min}–{summary.supplyNodesMinMax.max}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
