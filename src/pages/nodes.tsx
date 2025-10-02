import React, { useState } from 'react';
import NodeFilters from 'components/nodes/node-filters';
import NodeList from 'components/nodes/node-list';
import { TargetDistributionChart } from 'components/nodes/target-distribution-chart';
import { Member, NodeState } from '../types/cluster';
import { ErrorBoundary } from 'components/shared/errors/error-boundary';
import { useCluster } from '../contexts/use-cluster';
import { Alert, useStyles2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';
import { PageContainer } from 'layout/page-container';

const NodesPage = () => {
  const { cluster, error, refresh, isLoading } = useCluster();
  const [nameFilter, setNameFilter] = useState('');
  const [targetFilter, setTargetFilter] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<NodeState[]>([
    'New',
    'Starting',
    'Running',
    'Stopping',
    'Terminated',
    'Failed',
  ]);
  const [sortField, setSortField] = useState<'name' | 'target' | 'version' | 'buildDate'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: 'name' | 'target' | 'version' | 'buildDate') => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filterNodes = () => {
    if (!cluster) {
      return {};
    }

    return Object.entries(cluster.members).reduce((acc, [name, node]) => {
      const matchesName = name.toLowerCase().includes(nameFilter.toLowerCase());
      const matchesTarget = !targetFilter || targetFilter.length === 0 || targetFilter.includes(node.target);

      // Show node if any of its services match any of the selected states
      const hasMatchingService =
        selectedStates.length === 0 ||
        (node.services &&
          Array.isArray(node.services) &&
          node.services.some((service) => service?.status && selectedStates.includes(service.status as NodeState)));

      if (matchesName && matchesTarget && hasMatchingService) {
        acc[name] = node;
      }
      return acc;
    }, {} as { [key: string]: Member });
  };

  const getAvailableTargets = () => {
    if (!cluster) {
      return [];
    }
    const targets = new Set<string>();
    Object.values(cluster.members).forEach((node) => {
      if (node.target) {
        targets.add(node.target);
      }
    });
    return Array.from(targets).sort();
  };

  const styles = useStyles2(getStyles);

  return (
    <PageContainer>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.headerGrid}>
            <div className={styles.headerContent}>
              <div className={styles.titleSection}>
                <h2 className={styles.title}>Nodes</h2>
                <p className={styles.subtitle}>
                  View and manage Loki nodes in your cluster with their current status and configuration
                </p>
              </div>
              <NodeFilters
                nameFilter={nameFilter}
                targetFilter={targetFilter}
                selectedStates={selectedStates}
                onNameFilterChange={setNameFilter}
                onTargetFilterChange={setTargetFilter}
                onStatesChange={setSelectedStates}
                onRefresh={refresh}
                availableTargets={getAvailableTargets()}
                isLoading={isLoading}
              />
            </div>
            <div className={styles.chartContainer}>
              <div className={styles.chart}>
                <TargetDistributionChart nodes={filterNodes()} />
              </div>
            </div>
          </div>
        </div>
        <div className={styles.cardContent}>
          <div className={styles.contentSpace}>
            {error && (
              <Alert severity="error" title="Error">
                {error}
              </Alert>
            )}

            {isLoading && (
              <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <span className={styles.loadingText}>Loading...</span>
              </div>
            )}

            {!isLoading && !error && (
              <NodeList nodes={filterNodes()} sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  card: css`
    box-shadow: ${theme.shadows.z1};
  `,
  cardHeader: css`
    padding: ${theme.spacing(3)};
    border-bottom: 1px solid ${theme.colors.border.weak};
  `,
  headerGrid: css`
    display: grid;
    grid-template-columns: 1fr auto;
    gap: ${theme.spacing(4)};
  `,
  headerContent: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(3)};
  `,
  titleSection: css`
    display: flex;
    flex-direction: column;
  `,
  title: css`
    font-size: ${theme.typography.h2.fontSize};
    font-weight: ${theme.typography.fontWeightMedium};
    letter-spacing: -0.025em;
  `,
  subtitle: css`
    font-size: ${theme.typography.bodySmall.fontSize};
    color: ${theme.colors.text.secondary};
    margin-top: ${theme.spacing(0.5)};
  `,
  chartContainer: css`
    display: flex;
    align-items: center;
  `,
  chart: css`
    width: 250px;
  `,
  cardContent: css`
    padding: ${theme.spacing(3)};
  `,
  contentSpace: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(2)};
  `,
  loadingContainer: css`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: ${theme.spacing(2)};
  `,
  spinner: css`
    width: 24px;
    height: 24px;
    border: 2px solid ${theme.colors.primary.main};
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `,
  loadingText: css`
    margin-left: ${theme.spacing(1)};
    font-size: ${theme.typography.bodySmall.fontSize};
    color: ${theme.colors.text.secondary};
  `,
});

export default function NodesPageWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <NodesPage />
    </ErrorBoundary>
  );
}
