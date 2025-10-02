import React, { useEffect, useMemo, useState } from 'react';
import { DataTableColumnHeader } from '../components/common/data-table-column-header';
import { useCluster } from '../contexts/use-cluster';
import { useToast } from '../hooks/use-toast';
import { findNodeName } from '../lib/utils';
import { absolutePath } from '../util';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import * as z from 'zod';
import { Button, Card, Input, Combobox, Badge, Field, useStyles2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

const formSchema = z.object({
  tenant: z.string().min(1, 'Tenant ID is required'),
  since: z.string(),
  matcher: z.string().default('{}'),
});

const durationOptions = [
  { value: '1h', label: 'Last 1 hour' },
  { value: '3h', label: 'Last 3 hours' },
  { value: '6h', label: 'Last 6 hours' },
  { value: '12h', label: 'Last 12 hours' },
  { value: '24h', label: 'Last 24 hours' },
];

interface LabelValue {
  value: string;
  count: number;
}

interface LabelAnalysis {
  name: string;
  uniqueValues: number;
  inStreams: number;
  sampleValues: LabelValue[];
}

type SortField = 'name' | 'uniqueValues' | 'inStreams' | 'cardinality';
type MetricType = 'uniqueValues' | 'inStreams';

interface LabelValuesListProps {
  values: LabelValue[];
  totalValues: number;
}

const getStyles = (theme: GrafanaTheme2) => ({
  labelValueItem: css({
    display: 'grid',
    gridTemplateColumns: '200px 1fr 80px',
    alignItems: 'center',
    gap: 16,
    padding: '8px 0',
  }),
  progressBar: css({
    height: 8,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.shape.radius.default,
    overflow: 'hidden',
  }),
  progressFill: css({
    height: '100%',
    backgroundColor: theme.colors.primary.main,
    transition: 'width 0.3s ease',
  }),
  percentage: css({
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
  }),
  formGrid: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16,
    marginBottom: 16,
  }),
  buttonContainer: css({
    display: 'flex',
    alignItems: 'flex-start',
    paddingTop: 18,
  }),
  errorMessage: css({
    color: theme.colors.error.text,
    fontSize: 12,
    marginTop: 4,
  }),
  statsContainer: css({
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 16,
  }),
  statItem: css({
    display: 'flex',
    flexDirection: 'column',
  }),
  statLabel: css({
    fontSize: 12,
    color: theme.colors.text.secondary,
  }),
  statValue: css({
    fontSize: 24,
    fontWeight: 'bold',
  }),
  chartContainer: css({
    height: 500,
    width: '100%',
  }),
  tableContainer: css({
    overflow: 'auto',
  }),
  table: css({
    width: '100%',
    borderCollapse: 'collapse',
  }),
  tableHeader: css({
    borderBottom: `1px solid ${theme.colors.border.weak}`,
  }),
  tableHeaderCell: css({
    textAlign: 'left',
    padding: 12,
    fontWeight: 500,
  }),
  tableRow: css({
    borderBottom: `1px solid ${theme.colors.border.weak}`,
  }),
  tableCell: css({
    padding: 12,
  }),
  tableCellBold: css({
    padding: 12,
    fontWeight: 500,
  }),
  expandableRow: css({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  }),
  chevronIcon: css({
    height: 16,
    width: 16,
    transition: 'transform 0.2s',
    cursor: 'pointer',
  }),
  expandedDetails: css({
    marginTop: 16,
    padding: 16,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.shape.radius.default,
  }),
  expandedTitle: css({
    marginBottom: 12,
    fontSize: 14,
    fontWeight: 500,
  }),
});

function LabelValuesList({ values, totalValues }: LabelValuesListProps) {
  const styles = useStyles2(getStyles);

  return (
    <div>
      {values.map(({ value, count }) => (
        <div key={value} className={styles.labelValueItem}>
          <Badge text={value} color="blue" />
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${(count / totalValues) * 100}%` }} />
          </div>
          <span className={styles.percentage}>{((count / totalValues) * 100).toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyzeLabels() {
  const { cluster } = useCluster();
  const { toast } = useToast();
  const styles = useStyles2(getStyles);
  const [analysisResults, setAnalysisResults] = useState<{
    totalStreams: number;
    uniqueLabels: number;
    labels: LabelAnalysis[];
  } | null>(null);
  const [sortField, setSortField] = useState<SortField>('uniqueValues');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('uniqueValues');
  const [openRows, setOpenRows] = useState<Set<string>>(new Set());

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      matcher: '{}',
      since: '1h',
    },
  });

  const nodeName = findNodeName(cluster?.members, 'query-frontend');

  const { isLoading, refetch } = useQuery({
    queryKey: ['analyze-labels'],
    queryFn: async () => {
      try {
        const values = form.getValues();
        const end = new Date();
        const start = new Date(end.getTime() - parseDuration(values.since));

        const response = await fetch(
          absolutePath(
            `/api/v1/proxy/${nodeName}/loki/api/v1/series?match[]=${encodeURIComponent(values.matcher || '')}&start=${
              start.getTime() * 1e6
            }&end=${end.getTime() * 1e6}`
          ),
          {
            headers: {
              'X-Scope-OrgID': values.tenant,
            },
          }
        );

        if (!response.ok) {
          const error = await response.text();
          throw new Error(error || 'Failed to fetch series');
        }

        const data = await response.json();
        const labelMap = new Map<string, { uniqueValues: Set<string>; inStreams: number }>();
        const valueCountMap = new Map<string, Map<string, number>>();

        // Process the streams similar to the CLI tool
        data.data.forEach((stream: Record<string, string>) => {
          Object.entries(stream).forEach(([name, value]) => {
            if (!labelMap.has(name)) {
              labelMap.set(name, { uniqueValues: new Set(), inStreams: 0 });
              valueCountMap.set(name, new Map());
            }
            const label = labelMap.get(name) as {
              uniqueValues: Set<string>;
              inStreams: number;
            };
            const valueCounts = valueCountMap.get(name)!;

            label.uniqueValues.add(value);
            label.inStreams++;
            valueCounts.set(value, (valueCounts.get(value) || 0) + 1);
          });
        });

        // Convert to array and sort by unique values count
        const labels = Array.from(labelMap.entries()).map(([name, stats]) => {
          const valueCounts = Array.from(valueCountMap.get(name)!.entries())
            .map(([value, count]) => ({ value, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

          return {
            name,
            uniqueValues: stats.uniqueValues.size,
            inStreams: stats.inStreams,
            sampleValues: valueCounts,
          };
        });
        labels.sort((a, b) => b.uniqueValues - a.uniqueValues);

        setAnalysisResults({
          totalStreams: data.data.length,
          uniqueLabels: labelMap.size,
          labels,
        });

        return data;
      } catch (error) {
        toast({
          title: 'Error analyzing labels',
          description: error instanceof Error ? error.message : 'An unexpected error occurred',
        });
        throw error;
      }
    },
    enabled: false,
  });

  function onSubmit() {
    refetch();
  }

  // Generate CSS variables for colors
  const colorStyles = useMemo(() => {
    const style = document.createElement('style');
    const colors =
      analysisResults?.labels
        .slice(0, 10)
        .map((_, index) => {
          const hue = (index * 137.5) % 360;
          return `--chart-color-${index}: hsl(${hue}, 70%, 50%);`;
        })
        .join('\n') || '';
    style.textContent = `:root { ${colors} }`;
    document.head.appendChild(style);
    return () => style.remove();
  }, [analysisResults]);

  // Use effect to cleanup styles
  useEffect(() => {
    return colorStyles;
  }, [colorStyles]);

  // Chart configuration for colors
  const chartColors =
    analysisResults?.labels.slice(0, 10).map((_, index) => {
      const hue = (index * 137.5) % 360;
      return `hsl(${hue}, 70%, 50%)`;
    }) || [];

  const sortedLabels = useMemo(() => {
    if (!analysisResults) {
      return [];
    }

    return [...analysisResults.labels].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'uniqueValues':
          comparison = a.uniqueValues - b.uniqueValues;
          break;
        case 'inStreams':
          comparison = a.inStreams - b.inStreams;
          break;
        case 'cardinality':
          comparison = a.uniqueValues / a.inStreams - b.uniqueValues / b.inStreams;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [analysisResults, sortField, sortDirection]);

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Card.Heading>Analyze Labels</Card.Heading>
        <Card.Meta>Analyze label distribution across your log streams</Card.Meta>
        <Card.Description>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className={styles.formGrid}>
              <Field label="Tenant ID" required>
                <div>
                  <Input
                    placeholder="Enter tenant ID..."
                    {...form.register('tenant')}
                    invalid={!!form.formState.errors.tenant}
                  />
                  {form.formState.errors.tenant && (
                    <div className={styles.errorMessage}>{form.formState.errors.tenant.message}</div>
                  )}
                </div>
              </Field>

              <Field label="Time Range">
                <Combobox
                  value={form.watch('since') || '1h'}
                  onChange={(option) => form.setValue('since', option.value || '1h')}
                  options={durationOptions}
                  placeholder="Select time range"
                />
              </Field>

              <Field label="Matcher">
                <Input placeholder="Enter matcher... (default: {})" {...form.register('matcher')} />
              </Field>

              <div className={styles.buttonContainer}>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Analyzing...' : 'Analyze'}
                </Button>
              </div>
            </div>
          </form>
        </Card.Description>
      </Card>

      {analysisResults && (
        <>
          <Card>
            <Card.Heading>Label Distribution</Card.Heading>
            <Card.Description>Top 20 labels by unique values</Card.Description>
            <div>
              <div className={styles.statsContainer}>
                <div className={styles.statItem}>
                  <div className={styles.statLabel}>Total Streams</div>
                  <div className={styles.statValue}>{analysisResults.totalStreams.toLocaleString()}</div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statLabel}>Unique Labels</div>
                  <div className={styles.statValue}>{analysisResults.uniqueLabels.toLocaleString()}</div>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <Combobox
                  value={selectedMetric}
                  onChange={(option) => setSelectedMetric(option.value as MetricType)}
                  options={[
                    { label: 'Unique Values', value: 'uniqueValues' },
                    { label: 'Found In Streams', value: 'inStreams' },
                  ]}
                  placeholder="Select metric"
                  width={200}
                />
              </div>

              <div className={styles.chartContainer}>
                <BarChart
                  data={analysisResults.labels.slice(0, 20).map((label, index) => ({
                    name: label.name,
                    value: selectedMetric === 'uniqueValues' ? label.uniqueValues : label.inStreams,
                    fill: chartColors[index] || `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
                  }))}
                  layout="vertical"
                  margin={{
                    right: 24,
                  }}
                  barSize={((500 - 48) / Math.min(20, analysisResults.labels.length)) * 0.6}
                  maxBarSize={24}
                >
                  <CartesianGrid horizontal={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={90}
                    fontSize={11}
                    interval={0}
                  />
                  <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} />
                  <Bar dataKey="value" fillOpacity={0.8} radius={[4, 4, 0, 0]} />
                </BarChart>
              </div>
            </div>
          </Card>

          <Card>
            <Card.Heading>Label Details</Card.Heading>
            <div>
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr className={styles.tableHeader}>
                      <th className={styles.tableHeaderCell}>
                        <DataTableColumnHeader
                          title="Label Name"
                          field="name"
                          sortField={sortField}
                          sortDirection={sortDirection}
                          onSort={(field) => {
                            if (field === sortField) {
                              setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                            } else {
                              setSortField(field as SortField);
                              setSortDirection('desc');
                            }
                          }}
                        />
                      </th>
                      <th className={styles.tableHeaderCell}>
                        <DataTableColumnHeader
                          title="Unique Values"
                          field="uniqueValues"
                          sortField={sortField}
                          sortDirection={sortDirection}
                          onSort={(field) => {
                            if (field === sortField) {
                              setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                            } else {
                              setSortField(field as SortField);
                              setSortDirection('desc');
                            }
                          }}
                        />
                      </th>
                      <th className={styles.tableHeaderCell}>
                        <DataTableColumnHeader
                          title="Found In Streams"
                          field="inStreams"
                          sortField={sortField}
                          sortDirection={sortDirection}
                          onSort={(field) => {
                            if (field === sortField) {
                              setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                            } else {
                              setSortField(field as SortField);
                              setSortDirection('desc');
                            }
                          }}
                        />
                      </th>
                      <th className={styles.tableHeaderCell}>
                        <DataTableColumnHeader
                          title="Cardinality %"
                          field="cardinality"
                          sortField={sortField}
                          sortDirection={sortDirection}
                          onSort={(field) => {
                            if (field === sortField) {
                              setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                            } else {
                              setSortField(field as SortField);
                              setSortDirection('desc');
                            }
                          }}
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedLabels.map((label) => (
                      <tr key={label.name} className={styles.tableRow}>
                        <td className={styles.tableCellBold}>
                          <div className={styles.expandableRow}>
                            <ChevronDown
                              className={styles.chevronIcon}
                              style={{
                                transform: openRows.has(label.name) ? 'rotate(180deg)' : 'rotate(0deg)',
                              }}
                              onClick={() => {
                                const newOpenRows = new Set(openRows);
                                if (openRows.has(label.name)) {
                                  newOpenRows.delete(label.name);
                                } else {
                                  newOpenRows.add(label.name);
                                }
                                setOpenRows(newOpenRows);
                              }}
                            />
                            {label.name}
                          </div>
                        </td>
                        <td className={styles.tableCell}>{label.uniqueValues.toLocaleString()}</td>
                        <td className={styles.tableCell}>{label.inStreams.toLocaleString()}</td>
                        <td className={styles.tableCell}>
                          {((label.uniqueValues / label.inStreams) * 100).toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Show sample values for expanded rows */}
              {sortedLabels
                .filter((label) => openRows.has(label.name))
                .map((label) => (
                  <div key={`${label.name}-details`} className={styles.expandedDetails}>
                    <h4 className={styles.expandedTitle}>Sample values for {label.name}</h4>
                    <LabelValuesList values={label.sampleValues} totalValues={label.inStreams} />
                  </div>
                ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function parseDuration(duration: string): number {
  const value = parseInt(duration, 10);
  const unit = duration.slice(-1);
  const multiplier = unit === 'h' ? 3600000 : 0; // Convert hours to milliseconds
  return value * multiplier;
}
