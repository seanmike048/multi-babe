import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { parseMultiInput, analyseBatch, BatchItem, BatchSummary, BatchOutput } from '@/lib/batch';
import { InputPanel } from '@/components/Multi/InputPanel';
import { SummaryCard } from '@/components/Multi/SummaryCard';
import { Pagination } from '@/components/Multi/Pagination';
import { Detail } from '@/components/Multi/Detail';

const STORAGE_KEY = 'babe.multi.input';

export default function MultiPage() {
  const navigate = useNavigate();
  const [rawInput, setRawInput] = useState<string>('');
  const [items, setItems] = useState<BatchItem[]>([]);
  const [summary, setSummary] = useState<BatchSummary | null>(null);
  const [notices, setNotices] = useState<string[]>([]);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setRawInput(saved);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (rawInput) {
      localStorage.setItem(STORAGE_KEY, rawInput);
    }
  }, [rawInput]);

  const handleAnalyze = useCallback(() => {
    if (!rawInput.trim()) {
      toast.error('Input is empty.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const raws = parseMultiInput(rawInput);

      if (raws.length === 0) {
        toast.error('No bid-requests detected. Paste a JSON array, --- blocks, or NDJSON.');
        setIsLoading(false);
        return;
      }

      const result = analyseBatch(raws, 10);
      setItems(result.items);
      setSummary(result.summary);
      setNotices(result.notices);
      setSkipped(result.skipped);
      setPageIndex(0);
      setIsLoading(false);

      toast.success('Batch analysis complete!', {
        description: `${result.items.length} request(s) analyzed.`,
      });
    }, 300);
  }, [rawInput]);

  const handlePageChange = useCallback((page: number) => {
    if (page >= 0 && page < items.length) {
      setPageIndex(page);
    }
  }, [items.length]);

  return (
    <div className="min-h-screen bg-[#0c111d] text-slate-200 font-sans">
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-slate-800 p-2 rounded-lg border border-slate-700">
              <svg
                className="w-6 h-6 text-amber-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">BABE Verificator</h1>
          </div>
          <div className="flex items-center space-x-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/rulebook')}
                    className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                  >
                    <Info className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Rulebook</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>OpenRTB rulebook</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="flex items-center space-x-2 bg-slate-800 border border-slate-700 rounded-lg p-1">
              <Button
                variant="ghost"
                className="px-4 py-1.5 h-auto text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
                onClick={() => navigate('/')}
              >
                Single Analysis
              </Button>
              <Button
                variant="secondary"
                className="px-4 py-1.5 h-auto text-sm bg-slate-200 text-slate-900 hover:bg-slate-300"
              >
                Multi Analysis
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div
          className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          style={{ height: 'calc(100vh - 8rem)' }}
        >
          {/* Left: Input Panel */}
          <div className="lg:col-span-5 flex flex-col h-full">
            <InputPanel
              value={rawInput}
              onChange={setRawInput}
              onAnalyze={handleAnalyze}
              isLoading={isLoading}
            />
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-7 flex flex-col h-full space-y-4">
            {summary && items.length > 0 ? (
              <>
                <div className="flex-shrink-0">
                  <SummaryCard summary={summary} notices={notices} />
                </div>

                <div className="flex-shrink-0">
                  <Pagination
                    currentPage={pageIndex}
                    totalPages={items.length}
                    currentId={items[pageIndex]?.idLabel}
                    onPageChange={handlePageChange}
                  />
                </div>

                {skipped.length > 0 && (
                  <div className="flex-shrink-0 bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                    <p className="text-sm font-semibold text-blue-400 mb-1">Skipped Items:</p>
                    <ul className="text-xs text-blue-300/80 space-y-0.5">
                      {skipped.map((msg, idx) => (
                        <li key={idx}>• {msg}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex-grow overflow-hidden">
                  <Detail item={items[pageIndex]} />
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-slate-400">
                  <p className="text-lg font-semibold mb-2">Ready for Multi Analysis</p>
                  <p className="text-sm">
                    Paste multiple bid requests and click "Analyze Batch" to get started.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Toaster theme="dark" position="bottom-right" richColors />
    </div>
  );
}
