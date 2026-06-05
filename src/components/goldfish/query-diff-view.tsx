import React, { useState } from 'react';
import { SampledQuery, OUTCOME_MATCH, OUTCOME_MISMATCH, OUTCOME_ERROR } from 'types/goldfish';
import { Card, CardContent } from 'components/ui/card';
import { Badge } from 'components/ui/badge';
import { Button } from 'components/ui/button';
import { Separator } from 'components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from 'components/ui/collapsible';
import { StoredResultsDiff } from './stored-results-diff';
import { fetchStoredResult } from 'lib/goldfish-api';
import { useStore } from 'contexts/store-provider';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Database,
  Zap,
  FileText,
  Hash,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  Activity,
  Rocket,
  Code2,
  HardDrive,
  GitCompare,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { cn, formatBytes } from 'lib/utils';
import { useToast } from 'hooks/use-toast';

interface MetricComparison {
  label: string;
  icon?: React.ReactNode;
  valueA: number | null;
  valueB: number | null;
  formatter: (value: number | null) => string;
  lowerIsBetter: boolean;
  unit?: string;
}

function formatNumber(num: number | null): string {
  if (num === null) {
    return 'N/A';
  }
  return new Intl.NumberFormat().format(num);
}

function formatDuration(ms: number | null): string {
  if (ms === null) {
    return 'N/A';
  }
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

function getComparisonClass(
  valueA: number | null,
  valueB: number | null,
  lowerIsBetter: boolean
): {
  classA: string;
  classB: string;
  winner: 'A' | 'B' | 'tie' | null;
} {
  if (valueA === null || valueB === null) {
    return { classA: '', classB: '', winner: null };
  }

  const percentDiff = Math.abs((valueB - valueA) / valueA) * 100;
  const threshold = 5; // 5% threshold for significant difference

  if (percentDiff < threshold) {
    return {
      classA: 'text-muted-foreground',
      classB: 'text-muted-foreground',
      winner: 'tie',
    };
  }

  if (lowerIsBetter) {
    if (valueA < valueB) {
      return {
        classA: 'text-green-600 font-semibold',
        classB: 'text-red-600',
        winner: 'A',
      };
    } else {
      return {
        classA: 'text-red-600',
        classB: 'text-green-600 font-semibold',
        winner: 'B',
      };
    }
  } else {
    if (valueA > valueB) {
      return {
        classA: 'text-green-600 font-semibold',
        classB: 'text-red-600',
        winner: 'A',
      };
    } else {
      return {
        classA: 'text-red-600',
        classB: 'text-green-600 font-semibold',
        winner: 'B',
      };
    }
  }
}

function MetricRow({ metric }: { metric: MetricComparison }) {
  const comparison = getComparisonClass(metric.valueA, metric.valueB, metric.lowerIsBetter);

  return (
    <div className="grid grid-cols-7 gap-4 py-3 items-center">
      <div className="col-span-2 flex items-center gap-2 text-sm text-muted-foreground">
        {metric.icon}
        <span>{metric.label}</span>
      </div>
      <div className={cn('col-span-2 text-right font-mono text-sm', comparison.classA)}>
        {metric.formatter(metric.valueA)}
      </div>
      <div className="col-span-1 text-center">
        {comparison.winner === 'A' && <div className="text-green-600">◀</div>}
        {comparison.winner === 'B' && <div className="text-green-600">▶</div>}
        {comparison.winner === 'tie' && <div className="text-muted-foreground">≈</div>}
      </div>
      <div className={cn('col-span-2 text-left font-mono text-sm', comparison.classB)}>
        {metric.formatter(metric.valueB)}
      </div>
    </div>
  );
}

export function QueryDiffView({ query }: { query: SampledQuery }) {
  const { selectedDatasource } = useStore();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [showDiffDialog, setShowDiffDialog] = useState(false);

  const handleDownloadResult = async (cell: 'a' | 'b') => {
    if (!selectedDatasource?.uid) {
      toast({
        title: 'No datasource selected',
        description: 'Please select a datasource before downloading results.',
        variant: 'destructive',
      });
      return;
    }

    const result = await fetchStoredResult(selectedDatasource.uid, query.correlationId, cell);

    if (result.error) {
      toast({
        title: 'Failed to fetch result',
        description: result.error.message,
        variant: 'destructive',
      });
      return;
    }

    if (result.data) {
      // Create a data URI and trigger download
      const dataStr = 'data:application/json;charset=utf-8,' + encodeURIComponent(result.data);
      const a = document.createElement('a');
      a.download = `cell-${cell}-${query.correlationId}.json`;
      a.href = dataStr;
      a.click();
    }
  };

  const performanceMetrics: MetricComparison[] = [
    {
      label: 'Execution Time',
      icon: <Clock className="h-4 w-4" />,
      valueA: query.cellAExecTimeMs,
      valueB: query.cellBExecTimeMs,
      formatter: formatDuration,
      lowerIsBetter: true,
    },
    {
      label: 'Queue Time',
      icon: <Clock className="h-4 w-4" />,
      valueA: query.cellAQueueTimeMs,
      valueB: query.cellBQueueTimeMs,
      formatter: formatDuration,
      lowerIsBetter: true,
    },
    {
      label: 'Bytes Processed',
      icon: <Database className="h-4 w-4" />,
      valueA: query.cellABytesProcessed,
      valueB: query.cellBBytesProcessed,
      formatter: formatBytes,
      lowerIsBetter: false, // More bytes processed is generally better (higher throughput)
    },
    {
      label: 'Lines Processed',
      icon: <FileText className="h-4 w-4" />,
      valueA: query.cellALinesProcessed,
      valueB: query.cellBLinesProcessed,
      formatter: formatNumber,
      lowerIsBetter: false,
    },
    {
      label: 'Bytes/Second',
      icon: <Zap className="h-4 w-4" />,
      valueA: query.cellABytesPerSecond,
      valueB: query.cellBBytesPerSecond,
      formatter: formatBytes,
      lowerIsBetter: false, // Higher throughput is better
    },
    {
      label: 'Lines/Second',
      icon: <Zap className="h-4 w-4" />,
      valueA: query.cellALinesPerSecond,
      valueB: query.cellBLinesPerSecond,
      formatter: formatNumber,
      lowerIsBetter: false,
    },
    {
      label: 'Entries Returned',
      icon: <FileText className="h-4 w-4" />,
      valueA: query.cellAEntriesReturned,
      valueB: query.cellBEntriesReturned,
      formatter: formatNumber,
      lowerIsBetter: false,
    },
    {
      label: 'Splits',
      valueA: query.cellASplits,
      valueB: query.cellBSplits,
      formatter: formatNumber,
      lowerIsBetter: true, // Fewer splits is generally better
    },
    {
      label: 'Shards',
      valueA: query.cellAShards,
      valueB: query.cellBShards,
      formatter: formatNumber,
      lowerIsBetter: false,
    },
  ];

  const outcomeStatus = query.comparisonStatus;
  const responseMatch = query.cellAResponseHash === query.cellBResponseHash;
  const statusMatch = query.cellAStatusCode === query.cellBStatusCode;

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="p-4 space-y-2">
              {/* Query as main header */}
              <div className="flex items-start gap-2">
                <ChevronDown
                  className={cn('h-4 w-4 mt-0.5 transition-transform text-muted-foreground', isOpen && 'rotate-180')}
                />
                <code className="flex-1 text-xs font-mono break-all line-clamp-2">{query.query}</code>
              </div>

              {/* Key info bar */}
              <div className="flex items-center justify-between pl-6">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{formatDistanceToNow(new Date(query.sampledAt), { addSuffix: true })}</span>
                  <Badge variant="outline" className="text-xs">
                    {query.tenantId}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {query.queryType}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {query.user}
                  </Badge>
                  {(query.cellAUsedNewEngine || query.cellBUsedNewEngine) && (
                    <Badge variant="secondary" className="text-xs">
                      <Rocket className="h-3 w-3 mr-1" />
                      New Engine
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {outcomeStatus === OUTCOME_MATCH ? (
                    <div className="flex items-center gap-1 text-green-600 text-sm">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Match</span>
                    </div>
                  ) : outcomeStatus === OUTCOME_ERROR ? (
                    <div className="flex items-center gap-1 text-amber-600 text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Error</span>
                    </div>
                  ) : outcomeStatus === OUTCOME_MISMATCH ? (
                    <div className="flex items-center gap-1 text-red-600 text-sm">
                      <XCircle className="h-4 w-4" />
                      <span>Mismatch</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-gray-600 text-sm">
                      <span>Status: {outcomeStatus}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <Separator />
          <CardContent className="pt-4 space-y-6">
            {/* Query Time Range */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Query Time Range</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <div className="text-muted-foreground">Start Time</div>
                  <div className="font-mono text-xs">{format(new Date(query.startTime), 'yyyy-MM-dd HH:mm:ss')}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground">End Time</div>
                  <div className="font-mono text-xs">{format(new Date(query.endTime), 'yyyy-MM-dd HH:mm:ss')}</div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Response Status */}
            <div className="space-y-3">
              <div className="grid grid-cols-7 gap-4">
                <h4 className="col-span-2 text-sm font-medium">Response Status</h4>
                <div className="col-span-2 text-right text-sm font-medium">Cell A</div>
                <div className="col-span-1"></div>
                <div className="col-span-2 text-left text-sm font-medium">Cell B</div>
              </div>
              <div className="grid grid-cols-7 gap-4">
                <div className="col-span-2 text-sm text-muted-foreground">HTTP Status</div>
                <div className="col-span-2 text-right">
                  <Badge variant={query.cellAStatusCode === 200 ? 'default' : 'destructive'}>
                    {query.cellAStatusCode || 'N/A'}
                  </Badge>
                </div>
                <div className="col-span-1 text-center">
                  {statusMatch ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-orange-600 mx-auto" />
                  )}
                </div>
                <div className="col-span-2 text-left">
                  <Badge variant={query.cellBStatusCode === 200 ? 'default' : 'destructive'}>
                    {query.cellBStatusCode || 'N/A'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-4">
                <div className="col-span-2 text-sm text-muted-foreground flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Response Hash
                </div>
                <div className="col-span-2 text-right font-mono text-xs text-muted-foreground">
                  {query.cellAResponseHash ? `${query.cellAResponseHash.substring(0, 8)}...` : 'N/A'}
                </div>
                <div className="col-span-1 text-center">
                  {responseMatch && outcomeStatus !== OUTCOME_ERROR ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                  ) : outcomeStatus === OUTCOME_ERROR ? (
                    <AlertCircle className="h-4 w-4 text-orange-600 mx-auto" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600 mx-auto" />
                  )}
                </div>
                <div className="col-span-2 text-left font-mono text-xs text-muted-foreground">
                  {query.cellBResponseHash ? `${query.cellBResponseHash.substring(0, 8)}...` : 'N/A'}
                </div>
              </div>
            </div>

            <Separator />

            {/* Trace IDs */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Trace IDs</h4>
              <div className="grid grid-cols-7 gap-4">
                <div className="col-span-2 text-sm text-muted-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  <span>Trace</span>
                </div>
                <div className="col-span-2 text-right">
                  {query.cellATraceID ? (
                    query.cellATraceLink ? (
                      <a
                        href={query.cellATraceLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {query.cellASpanID ? query.cellASpanID : query.cellATraceID}
                      </a>
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground">
                        {query.cellASpanID ? query.cellASpanID : query.cellATraceID}
                      </span>
                    )
                  ) : (
                    <span className="font-mono text-xs">N/A</span>
                  )}
                </div>
                <div className="col-span-1"></div>
                <div className="col-span-2 text-left">
                  {query.cellBTraceID ? (
                    query.cellBTraceLink ? (
                      <a
                        href={query.cellBTraceLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {query.cellBSpanID ? query.cellBSpanID : query.cellBTraceID}
                      </a>
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground">
                        {query.cellBSpanID ? query.cellBSpanID : query.cellBTraceID}
                      </span>
                    )
                  ) : (
                    <span className="font-mono text-xs">N/A</span>
                  )}
                </div>
              </div>

              {/* Logs Links - only show if we have logs links */}
              {(query.cellALogsLink || query.cellBLogsLink) && (
                <div className="grid grid-cols-7 gap-4">
                  <div className="col-span-2 text-sm text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Logs (by TraceID)</span>
                  </div>
                  <div className="col-span-2 text-right">
                    {query.cellALogsLink ? (
                      <a
                        href={query.cellALogsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {query.cellATraceID}
                      </a>
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground">-</span>
                    )}
                  </div>
                  <div className="col-span-1"></div>
                  <div className="col-span-2 text-left">
                    {query.cellBLogsLink ? (
                      <a
                        href={query.cellBLogsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {query.cellBTraceID}
                      </a>
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground">-</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Stored Results - only show if at least one cell has stored results */}
            {(query.cellAResultURI || query.cellBResultURI) && (
              <>
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Stored Results</h4>
                  <div className="grid grid-cols-7 gap-4">
                    <div className="col-span-2 text-sm text-muted-foreground flex items-center gap-2">
                      <HardDrive className="h-4 w-4" />
                      <span>Raw Results in Object Storage</span>
                    </div>
                    <div className="col-span-2 text-right">
                      {query.cellAResultURI ? (
                        <div className="flex flex-col items-end gap-1">
                          <button
                            onClick={() => handleDownloadResult('a')}
                            className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                          >
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            <span>Stored</span>
                          </button>
                          {query.cellAResultSizeBytes && (
                            <div className="text-xs text-muted-foreground">
                              {formatBytes(query.cellAResultSizeBytes)}
                              {query.cellAResultCompression && ` (${query.cellAResultCompression})`}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">Not stored</div>
                      )}
                    </div>
                    <div className="col-span-1">
                      {query.cellAResultURI && query.cellBResultURI && (
                        <div className="flex items-center justify-center pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDiffDialog(true)}
                            className="gap-2 dark:bg-sky-600 dark:hover:bg-sky-800 bg-sky-400 hover:bg-sky-600"
                          >
                            <GitCompare className="h-4 w-4" />
                            Compare
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="col-span-2 text-left">
                      {query.cellBResultURI ? (
                        <div className="flex flex-col items-start gap-1">
                          <button
                            onClick={() => handleDownloadResult('b')}
                            className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                          >
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            <span>Stored</span>
                          </button>
                          {query.cellBResultSizeBytes && (
                            <div className="text-xs text-muted-foreground">
                              {formatBytes(query.cellBResultSizeBytes)}
                              {query.cellBResultCompression && ` (${query.cellBResultCompression})`}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">Not stored</div>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />
              </>
            )}

            {/* Query Engine */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Query Engine</h4>
              <div className="grid grid-cols-7 gap-4">
                <div className="col-span-2 text-sm text-muted-foreground flex items-center gap-2">
                  <Rocket className="h-4 w-4" />
                  <span>Engine Version</span>
                </div>
                <div className="col-span-2 text-right">
                  <div
                    className={cn(
                      'inline-flex items-center gap-1 text-sm',
                      query.cellAUsedNewEngine ? 'text-green-600' : 'text-muted-foreground'
                    )}
                  >
                    {query.cellAUsedNewEngine ? (
                      <>
                        <Rocket className="h-4 w-4" />
                        <span>New Engine</span>
                      </>
                    ) : (
                      <>
                        <Code2 className="h-4 w-4" />
                        <span>Legacy Engine</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="col-span-1 text-center">
                  {query.cellAUsedNewEngine === query.cellBUsedNewEngine ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-orange-600 mx-auto" />
                  )}
                </div>
                <div className="col-span-2 text-left">
                  <div
                    className={cn(
                      'inline-flex items-center gap-1 text-sm',
                      query.cellBUsedNewEngine ? 'text-green-600' : 'text-muted-foreground'
                    )}
                  >
                    {query.cellBUsedNewEngine ? (
                      <>
                        <Rocket className="h-4 w-4" />
                        <span>New Engine</span>
                      </>
                    ) : (
                      <>
                        <Code2 className="h-4 w-4" />
                        <span>Legacy Engine</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Performance Metrics */}
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Performance Metrics</h4>
              {performanceMetrics.map((metric, i) => (
                <MetricRow key={i} metric={metric} />
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {/* Diff Dialog */}
      <StoredResultsDiff
        open={showDiffDialog}
        onOpenChange={setShowDiffDialog}
        correlationId={query.correlationId}
        cellASize={query.cellAResultSizeBytes}
        cellBSize={query.cellBResultSizeBytes}
        cellACompression={query.cellAResultCompression}
        cellBCompression={query.cellBResultCompression}
      />
    </Card>
  );
}
