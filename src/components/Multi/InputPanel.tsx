import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Play } from 'lucide-react';

interface InputPanelProps {
  value: string;
  onChange: (value: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
}

export const InputPanel: React.FC<InputPanelProps> = ({
  value,
  onChange,
  onAnalyze,
  isLoading,
}) => {
  const handleFormat = () => {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        onChange(JSON.stringify(parsed, null, 2));
      }
    } catch {
      // Silently fail if not valid JSON array
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800 flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b border-slate-800 flex-shrink-0">
        <CardTitle className="text-base flex items-center font-semibold text-white">
          <FileText className="w-4 h-4 mr-2 text-orange-400" />
          Multi Bid Request Input
        </CardTitle>
        <Button variant="outline" size="sm" onClick={handleFormat}>
          Format
        </Button>
      </CardHeader>
      <CardContent className="p-0 flex-grow overflow-hidden flex flex-col">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste multiple bid requests here...&#10;&#10;Accepts:&#10;• JSON array: [{...}, {...}, ...]&#10;• Blocks separated by ---&#10;• NDJSON (one JSON per line)"
          className="w-full h-full p-4 font-mono text-sm bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-300 resize-none border-0"
          spellCheck="false"
          aria-label="Multi bid request input textarea"
        />
        <div className="p-3 border-t border-slate-800 flex items-center space-x-2 flex-shrink-0">
          <Button
            onClick={onAnalyze}
            disabled={isLoading || !value.trim()}
            className="w-full bg-orange-500 hover:bg-orange-600 text-slate-900 font-bold py-2 text-sm"
          >
            {isLoading ? (
              <div className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full mr-2" />
            ) : (
              <Play className="w-5 h-5 mr-2" />
            )}
            {isLoading ? 'Analyzing...' : 'Analyze Batch'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
