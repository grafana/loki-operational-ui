import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from 'components/ui/dialog';
import { Alert, AlertDescription } from 'components/ui/alert';
import { Skeleton } from 'components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { fetchStoredResult } from 'lib/goldfish-api';
import { useStore } from 'contexts/store-provider';
import { useTheme } from 'features/theme';
import { DiffEditor } from '@monaco-editor/react';
import { formatBytes } from 'lib/utils';

interface StoredResultsDiffProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  correlationId: string;
  cellASize?: number | null;
  cellBSize?: number | null;
  cellACompression?: string | null;
  cellBCompression?: string | null;
}

export function StoredResultsDiff({
  open,
  onOpenChange,
  correlationId,
  cellASize,
  cellBSize,
  cellACompression,
  cellBCompression,
}: StoredResultsDiffProps) {
  const { selectedDatasource } = useStore();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cellAData, setCellAData] = useState<string>('');
  const [cellBData, setCellBData] = useState<string>('');

  useEffect(() => {
    if (!open || !selectedDatasource?.uid) {
      return;
    }

    const abortController = new AbortController();

    const fetchAndFormatResults = async () => {
      setIsLoading(true);
      setError(null);
      setCellAData('');
      setCellBData('');

      try {
        // Fetch both results in parallel
        const [resultA, resultB] = await Promise.all([
          fetchStoredResult(selectedDatasource.uid, correlationId, 'a'),
          fetchStoredResult(selectedDatasource.uid, correlationId, 'b'),
        ]);

        // If aborted, stop processing
        if (abortController.signal.aborted) {
          return;
        }

        // Check for errors
        if (resultA.error) {
          throw new Error(`Cell A: ${resultA.error.message}`);
        }
        if (resultB.error) {
          throw new Error(`Cell B: ${resultB.error.message}`);
        }

        if (!resultA.data || !resultB.data) {
          throw new Error('Failed to fetch stored results');
        }

        // Pretty-print JSON
        let jsonA: string;
        let jsonB: string;

        try {
          jsonA = JSON.stringify(JSON.parse(resultA.data), null, 2);
        } catch {
          // If not valid JSON, use as-is
          jsonA = resultA.data;
        }

        try {
          jsonB = JSON.stringify(JSON.parse(resultB.data), null, 2);
        } catch {
          // If not valid JSON, use as-is
          jsonB = resultB.data;
        }

        if (abortController.signal.aborted) {
          return;
        }

        setCellAData(jsonA);
        setCellBData(jsonB);
      } catch (err) {
        if (abortController.signal.aborted) {
          return;
        }
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchAndFormatResults();

    return () => {
      abortController.abort();
    };
  }, [open, correlationId, selectedDatasource?.uid]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-[90vw] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Compare Stored Query Results</DialogTitle>
          <DialogDescription>
            Correlation ID: {correlationId}
            {(cellASize || cellBSize) && (
              <span className="ml-4 text-xs">
                Cell A: {formatBytes(cellASize ?? null)}
                {cellACompression && ` (${cellACompression})`}
                {' | '}
                Cell B: {formatBytes(cellBSize ?? null)}
                {cellBCompression && ` (${cellBCompression})`}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden border rounded-md bg-muted/50">
          {isLoading && (
            <div className="space-y-2 p-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          )}

          {error && (
            <div className="p-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          {!isLoading && !error && cellAData && cellBData && (
            <DiffEditor
              original={cellAData}
              modified={cellBData}
              language="json"
              theme={theme === 'dark' ? 'vs-dark' : 'vs'}
              height="100%"
              options={{
                renderSideBySide: true,
                readOnly: true,
                automaticLayout: true,
              }}
            />
          )}

          {!isLoading && !error && (!cellAData || !cellBData) && (
            <div className="p-4 text-center text-muted-foreground">
              No data available to compare
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
