import React, { useState, useCallback, useMemo } from 'react';
import { RingType } from '../types/ring';
import { Button, useStyles2, Badge, ConfirmModal } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';
import { AVAILABLE_RINGS, useRing } from '../hooks/use-ring';
import { RingInstanceTable, SortField } from '../components/ring/ring-instance-table';
import { RingFilters } from '../components/ring/ring-filters';
import { getStateColor } from '../lib/ring-utils';
import { RingStateDistributionChart } from '../components/ring/ring-state-distribution-chart';
import { RefreshLoop } from '../components/common/refresh-loop';
import { BaseRing } from './base-ring';
import { useToast } from '../hooks/use-toast';
import { PageContainer } from 'layout/page-container';

interface RegularRingProps {
  ringName: RingType;
}

const getStyles = (theme: GrafanaTheme2) => ({
  card: css`
    background: ${theme.colors.background.primary};
    border: 1px solid ${theme.colors.border.weak};
    border-radius: ${theme.shape.radius.default};
    padding: ${theme.spacing(3)};
  `,
  cardHeader: css`
    margin-bottom: ${theme.spacing(3)};
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
  titleSection: css``,
  title: css`
    font-size: ${theme.typography.h2.fontSize};
    font-weight: ${theme.typography.h2.fontWeight};
    margin: 0 0 ${theme.spacing(0.5)} 0;
  `,
  subtitle: css`
    font-size: ${theme.typography.bodySmall.fontSize};
    color: ${theme.colors.text.secondary};
    margin: 0;
  `,
  controls: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 32px;
  `,
  selectedInfo: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(2)};
  `,
  selectedText: css`
    font-size: ${theme.typography.bodySmall.fontSize};
    color: ${theme.colors.text.secondary};
  `,
  chartContainer: css`
    display: flex;
    align-items: center;
  `,
  chart: css`
    width: 250px;
  `,
  cardContent: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(3)};
  `,
  tableContainer: css`
    border: 1px solid ${theme.colors.border.weak};
    border-radius: ${theme.shape.radius.default};
    background: ${theme.colors.background.primary};
  `,
  modalInstance: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: ${theme.spacing(1)};
    border-radius: ${theme.shape.radius.default};
    background: ${theme.colors.background.secondary};
    margin-bottom: ${theme.spacing(1)};
  `,
  modalInstanceInfo: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
  `,
  modalInstanceLabel: css`
    font-weight: ${theme.typography.fontWeightMedium};
  `,
  modalInstanceAddress: css`
    font-size: ${theme.typography.bodySmall.fontSize};
    color: ${theme.colors.text.secondary};
  `,
  forgetButton: css`
    background: ${theme.colors.error.transparent};
    color: ${theme.colors.error.text};
    border: 1px solid ${theme.colors.error.border};
    &:hover {
      background: ${theme.colors.error.transparent};
      opacity: 0.8;
    }
    &:disabled {
      background: ${theme.colors.error.transparent};
      opacity: 0.5;
    }
  `,
});

export function RegularRing({ ringName }: RegularRingProps) {
  const styles = useStyles2(getStyles);
  const [selectedInstances, setSelectedInstances] = useState<Set<string>>(new Set());
  const [isForgetLoading, setIsForgetLoading] = useState(false);
  const [forgetProgress, setForgetProgress] = useState<number>(0);
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [idFilter, setIdFilter] = useState('');
  const [stateFilter, setStateFilter] = useState<string[]>([]);
  const [zoneFilter, setZoneFilter] = useState<string[]>([]);
  const [isForgetDialogOpen, setIsForgetDialogOpen] = useState(false);

  const { ring, error, isLoading, fetchRing, forgetInstances, uniqueStates, uniqueZones, isTokenBased } = useRing({
    ringName,
    isPaused: selectedInstances.size > 0,
  });

  // Get selected instance details
  const selectedInstanceDetails = useMemo(() => {
    if (!ring?.shards) {
      return [];
    }
    return ring.shards.filter((instance) => selectedInstances.has(instance.id));
  }, [ring?.shards, selectedInstances]);

  // Handle sorting
  const handleSort = useCallback((field: SortField) => {
    setSortField((currentField) => {
      if (currentField === field) {
        setSortDirection((currentDirection) => (currentDirection === 'asc' ? 'desc' : 'asc'));
        return field;
      }
      setSortDirection('asc');
      return field;
    });
  }, []);

  // Handle instance selection
  const toggleInstance = useCallback((instanceId: string) => {
    setSelectedInstances((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(instanceId)) {
        newSet.delete(instanceId);
      } else {
        newSet.add(instanceId);
      }
      return newSet;
    });
  }, []);

  const { toast } = useToast();

  // Handle forget instances
  const handleForget = useCallback(async () => {
    if (selectedInstances.size === 0) {
      return;
    }

    try {
      setIsForgetLoading(true);
      setForgetProgress(0);

      const { success, total } = await forgetInstances(Array.from(selectedInstances));
      if (success > 0) {
        await fetchRing();
        setSelectedInstances(new Set());
      }

      if (success < total) {
        toast({
          title: 'Failed to forget instances',
          description: `Failed to forget ${total - success} instance(s)`,
        });
      }
    } catch {
      toast({
        title: 'Failed to forget instances',
        description: `${error}`,
      });
    } finally {
      setIsForgetLoading(false);
      setIsForgetDialogOpen(false);
    }
  }, [selectedInstances, forgetInstances, fetchRing, toast, error]);

  // Filter and sort instances
  const sortedInstances = useMemo(() => {
    if (!ring?.shards) {
      return [];
    }

    return ring.shards
      .filter((instance) => {
        const matchesId = instance.id.toLowerCase().includes(idFilter.toLowerCase());
        const matchesState = stateFilter.length === 0 || stateFilter.includes(instance.state);
        const matchesZone = zoneFilter.length === 0 || zoneFilter.includes(instance.zone);
        return matchesId && matchesState && matchesZone;
      })
      .sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'id':
            comparison = a.id.localeCompare(b.id);
            break;
          case 'state':
            comparison = a.state.localeCompare(b.state);
            break;
          case 'address':
            comparison = a.address.localeCompare(b.address);
            break;
          case 'zone':
            comparison = (a.zone || '').localeCompare(b.zone || '');
            break;
          case 'timestamp':
            comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
            break;
          case 'tokens':
            comparison = a.tokens.length - b.tokens.length;
            break;
          case 'ownership':
            comparison = parseFloat(a.ownership) - parseFloat(b.ownership);
            break;
        }
        return sortDirection === 'asc' ? comparison : -comparison;
      });
  }, [ring?.shards, idFilter, stateFilter, zoneFilter, sortField, sortDirection]);

  if (error) {
    return <BaseRing error={error} ringName={ringName} />;
  }

  return (
    <PageContainer>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.headerGrid}>
            <div className={styles.headerContent}>
              <div className={styles.titleSection}>
                <h2 className={styles.title}>
                  {AVAILABLE_RINGS.find((r) => r.id === ringName)?.title || ''} Ring Members
                </h2>
                <p className={styles.subtitle}>
                  View and manage ring instances with their current status and configuration
                </p>
              </div>
              <div className={styles.controls}>
                <RefreshLoop onRefresh={fetchRing} isPaused={selectedInstances.size > 0} isLoading={isLoading} />
                {selectedInstances.size > 0 && (
                  <div className={styles.selectedInfo}>
                    <span className={styles.selectedText}>
                      {selectedInstances.size} instance
                      {selectedInstances.size !== 1 ? 's' : ''} selected
                    </span>
                    <Button
                      onClick={() => setIsForgetDialogOpen(true)}
                      disabled={isForgetLoading}
                      size="sm"
                      variant="secondary"
                      className={styles.forgetButton}
                    >
                      {isForgetLoading && forgetProgress > 0 && (
                        <span style={{ marginRight: '8px' }}>
                          {forgetProgress}/{selectedInstances.size}
                        </span>
                      )}
                      Forget Selected
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div className={styles.chartContainer}>
              <div className={styles.chart}>
                {ring?.shards && <RingStateDistributionChart instances={ring.shards} />}
              </div>
            </div>
          </div>
        </div>
        <div className={styles.cardContent}>
          <RingFilters
            idFilter={idFilter}
            onIdFilterChange={setIdFilter}
            stateFilter={stateFilter}
            onStateFilterChange={setStateFilter}
            zoneFilter={zoneFilter}
            onZoneFilterChange={setZoneFilter}
            uniqueStates={uniqueStates}
            uniqueZones={uniqueZones}
          />
          <div className={styles.tableContainer}>
            <RingInstanceTable
              instances={sortedInstances}
              selectedInstances={selectedInstances}
              onSelectInstance={toggleInstance}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              showTokens={isTokenBased}
            />
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={isForgetDialogOpen}
        title="Confirm Forget Instances"
        body={
          <div>
            <p>Are you sure you want to forget the following instances? This action cannot be undone.</p>
            <div style={{ maxHeight: '300px', overflowY: 'auto', marginTop: '16px' }}>
              {selectedInstanceDetails.map((instance) => (
                <div key={instance.id} className={styles.modalInstance}>
                  <div className={styles.modalInstanceInfo}>
                    <span className={styles.modalInstanceLabel}>{instance.id}</span>
                    <Badge text={instance.state} color={getStateColor(instance.state)} />
                  </div>
                  <span className={styles.modalInstanceAddress}>{instance.address}</span>
                </div>
              ))}
            </div>
          </div>
        }
        confirmText={isForgetLoading ? 'Forgetting...' : 'Forget Instances'}
        dismissText="Cancel"
        onConfirm={handleForget}
        onDismiss={() => setIsForgetDialogOpen(false)}
        confirmButtonVariant="destructive"
      />
    </PageContainer>
  );
}
