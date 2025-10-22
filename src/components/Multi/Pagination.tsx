import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  currentId?: string;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  currentId,
  onPageChange,
}) => {
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentPage > 0) {
        onPageChange(currentPage - 1);
      } else if (e.key === 'ArrowRight' && currentPage < totalPages - 1) {
        onPageChange(currentPage + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, onPageChange]);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg p-3">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
        aria-label="Previous page"
        className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Prev
      </Button>

      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">
            Page {currentPage + 1} of {totalPages}
          </span>
          
          <Select
            value={String(currentPage)}
            onValueChange={(value) => onPageChange(Number(value))}
          >
            <SelectTrigger className="w-20 h-8 bg-slate-800 border-slate-700 text-slate-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-slate-300 max-h-60">
              {Array.from({ length: totalPages }, (_, i) => (
                <SelectItem key={i} value={String(i)} className="hover:bg-slate-700">
                  {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {currentId && (
          <span className="text-xs text-slate-500">
            ID: <span className="text-amber-400 font-mono">{currentId}</span>
          </span>
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages - 1}
        aria-label="Next page"
        className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50"
      >
        Next
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
};
