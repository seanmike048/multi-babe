import React from 'react';
import { Card } from '@/components/ui/card';
import { XCircle } from 'lucide-react';
import { ValidationResults } from '@/components/ValidationResults';
import { BatchItem } from '@/lib/batch';
import { ValidationIssue } from '@/lib/analyzer';

interface DetailProps {
  item: BatchItem;
}

export const Detail: React.FC<DetailProps> = ({ item }) => {
  const { analysis } = item;

  // Convert new issue format to legacy format for ValidationResults
  const legacyIssues: ValidationIssue[] = analysis.issues
    ? analysis.issues.map((issue) => ({
        severity: issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1) as 'Error' | 'Warning' | 'Info',
        message: issue.message,
        path: issue.path || '',
      }))
    : [];

  // Handle invalid JSON
  if (analysis.error) {
    return (
      <Card className="h-full flex flex-col items-center justify-center text-center bg-red-900/20 border-red-500/30 p-8">
        <XCircle className="w-12 h-12 mb-4 text-red-400" />
        <h3 className="text-xl font-bold text-white">Invalid JSON</h3>
        <p className="text-red-400/80 mt-2 max-w-md">{analysis.error}</p>
      </Card>
    );
  }

  return (
    <ValidationResults
      analysis={analysis}
      issues={legacyIssues}
      isLoading={false}
    />
  );
};
