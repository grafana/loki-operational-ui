import React, { useEffect, useState } from 'react';
import { GoldfishStatistics } from 'types/goldfish';
import { fetchGoldfishStats } from 'lib/goldfish-api';
import { Skeleton } from 'components/ui/skeleton';
import { Alert, AlertDescription } from 'components/ui/alert';
import { AlertCircle, HelpCircle } from 'lucide-react';
import { cn } from 'lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'components/ui/tooltip';

interface StatsBarProps {
  datasourceUid: string;
  tenant?: string;
  user?: string;
  from?: Date;
  to?: Date;
}

interface StatCardProps {
  label: string;
  value: string;
  bgColor: string;
  tooltip: string;
}

function StatCard({ label, value, bgColor, tooltip }: StatCardProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'rounded-lg p-4 text-white flex flex-col items-center justify-center gap-1 transition-colors duration-300',
              bgColor
            )}
          >
            <div className="text-3xl font-bold">{value}</div>
            <div className="text-sm opacity-90 flex items-center gap-1">
              {label}
              <HelpCircle className="h-3 w-3" />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function getMatchingQueriesColor(value: number): string {
  if (value >= 1.0) { return 'bg-green-500'; }
  if (value >= 0.66) { return 'bg-yellow-500'; }
  if (value >= 0.33) { return 'bg-orange-500'; }
  return 'bg-red-500';
}

function getPerformanceDifferenceColor(value: number): string {
  if (value >= 10) { return 'bg-red-500'; }
  if (value >= 1) { return 'bg-yellow-500'; }
  if (value >= 0.5) { return 'bg-yellow-500'; }
  if (value >= 0) { return 'bg-blue-500'; }
  return 'bg-green-500';
}

export function StatsBar({ datasourceUid, tenant, user, from, to }: StatsBarProps) {
  const [stats, setStats] = useState<GoldfishStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!datasourceUid) { return; }

    const abortController = new AbortController();

    async function loadStats() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchGoldfishStats(
          datasourceUid,
          tenant,
          user,
          from,
          to,
          abortController.signal
        );

        if (result.error) {
          setError(result.error.message);
          setIsLoading(false);
          return;
        }

        if (result.data) {
          setStats(result.data);
        }

        setIsLoading(false);
      } catch (err) {
        // This shouldn't happen since fetchGoldfishStats catches all errors,
        // but handle it just in case
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setIsLoading(false);
      }
    }

    loadStats();

    return () => {
      abortController.abort();
    };
  }, [datasourceUid, tenant, user, from, to]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load statistics: {error}</AlertDescription>
      </Alert>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      <StatCard
        label="Queries executed"
        value={`${stats.queriesExecuted.toLocaleString()} queries`}
        bgColor="bg-blue-500"
        tooltip="Total number of queries that were sampled and executed with the new engine during the selected time range."
      />
      <StatCard
        label="Engine coverage"
        value={`${(stats.engineCoverage * 100).toFixed(1)}%`}
        bgColor="bg-blue-500"
        tooltip="Percentage of queries that used the new query engine compared to all queries in the system."
      />
      <StatCard
        label="Matching queries"
        value={`${(stats.matchingQueries * 100).toFixed(1)}%`}
        bgColor={getMatchingQueriesColor(stats.matchingQueries)}
        tooltip="Percentage of queries where both the old and new engines returned identical results. Higher is better."
      />
      <StatCard
        label="Performance difference (geomean)"
        value={`${(Math.abs(stats.performanceDifference) * 100).toFixed(0)}%`}
        bgColor={getPerformanceDifferenceColor(stats.performanceDifference)}
        tooltip="Geometric mean of the performance difference between new and old engines. Positive values indicate the new engine is slower, negative values indicate it's faster."
      />
    </div>
  );
}
