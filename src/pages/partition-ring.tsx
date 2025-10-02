import React, { useState, useCallback, useMemo } from 'react';
import { usePartitionRing } from '../hooks/use-partition-ring';
import { PartitionRingTable, SortField } from '../components/ring/partition-ring-table';
import { getStateColor, parseZoneFromOwner } from '../lib/ring-utils';
import { useToast } from '../hooks/use-toast';
import { RefreshLoop } from '../components/common/refresh-loop';
import { Select, Badge } from '@grafana/ui';
import { ArrowRightCircle } from 'lucide-react';
import { Button, useStyles2, ConfirmModal } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';
import { PartitionStateDistributionChart } from '../components/ring/partition-state-distribution-chart';
import { PartitionRingFilters } from '../components/ring/partition-ring-filters';
import { BaseRing } from './base-ring';
import { PageContainer } from 'layout/page-container';

const STATE_OPTIONS = [
  { value: 1, label: 'Pending' },
  { value: 2, label: 'Active' },
  { value: 3, label: 'Inactive' },
  { value: 4, label: 'Deleted' },
] as const;

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
  modalPartition: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: ${theme.spacing(1)};
    border-radius: ${theme.shape.radius.default};
    background: ${theme.colors.background.secondary};
    margin-bottom: ${theme.spacing(1)};
  `,
  modalPartitionInfo: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
  `,
  modalPartitionLabel: css`
    font-weight: ${theme.typography.fontWeightMedium};
  `,
});

export default function PartitionRing() {
  const styles = useStyles2(getStyles);
  const [selectedPartitions, setSelectedPartitions] = useState<Set<number>>(new Set());
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [idFilter, setIdFilter] = useState<string[]>([]);
  const [stateFilter, setStateFilter] = useState<string[]>([]);
  const [zoneFilter, setZoneFilter] = useState<string[]>([]);
  const [ownerFilter, setOwnerFilter] = useState('');
  const [isStateChangeLoading, setIsStateChangeLoading] = useState(false);
  const [selectedNewState, setSelectedNewState] = useState<number>();
  const [isStateChangeDialogOpen, setIsStateChangeDialogOpen] = useState(false);
  const { toast } = useToast();

  const {
    partitions,
    error: partitionError,
    isLoading: isPartitionsLoading,
    fetchPartitions,
    changePartitionState,
    uniqueStates,
    uniqueZones,
  } = usePartitionRing({ isPaused: selectedPartitions.size > 0 });

  // Denormalize partitions by owner
  const denormalizedPartitions = useMemo(() => {
    return partitions.flatMap((partition) =>
      partition.owner_ids.map((owner) => ({
        ...partition,
        owner_id: owner,
        owner_ids: [owner],
        zone: parseZoneFromOwner(owner),
      }))
    );
  }, [partitions]);

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

  // Handle partition selection
  const togglePartition = useCallback((partitionId: number) => {
    setSelectedPartitions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(partitionId)) {
        newSet.delete(partitionId);
      } else {
        newSet.add(partitionId);
      }
      return newSet;
    });
  }, []);

  // Filter partitions
  const filteredPartitions = useMemo(() => {
    return denormalizedPartitions.filter((partition) => {
      const matchesId = idFilter.length === 0 || idFilter.includes(partition.id.toString());
      const matchesState = stateFilter.length === 0 || stateFilter.includes(partition.state.toString());
      const matchesZone = zoneFilter.length === 0 || zoneFilter.includes(partition.zone);
      const matchesOwner = ownerFilter ? partition.owner_id.toLowerCase().includes(ownerFilter.toLowerCase()) : true;

      return matchesId && matchesState && matchesZone && matchesOwner;
    });
  }, [denormalizedPartitions, idFilter, stateFilter, zoneFilter, ownerFilter]);

  // Get selected partition details
  const selectedPartitionDetails = useMemo(
    () => denormalizedPartitions.filter((partition) => selectedPartitions.has(partition.id)),
    [denormalizedPartitions, selectedPartitions]
  );

  // Handle state change
  const handleStateChange = useCallback(async () => {
    if (selectedPartitions.size === 0 || !selectedNewState) {
      return;
    }

    try {
      setIsStateChangeLoading(true);
      const { success, total } = await changePartitionState(
        selectedPartitionDetails.map((p) => p.id),
        selectedNewState.toString()
      );

      if (success > 0 && total === success) {
        toast({
          title: 'State Change Success',
          description: `Successfully changed state for ${success} partition${success !== 1 ? 's' : ''} to ${
            STATE_OPTIONS.find((opt) => opt.value === selectedNewState)?.label
          }`,
        });
        await fetchPartitions();
      } else if (success < total) {
        toast({
          title: 'State Change Failed',
          description: `Failed to change state for ${total - success} partition${total - success !== 1 ? 's' : ''}.`,
        });
      }

      setSelectedPartitions(new Set());
      setSelectedNewState(undefined);
    } catch {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while changing partition states.',
      });
    } finally {
      setIsStateChangeLoading(false);
      setIsStateChangeDialogOpen(false);
    }
  }, [selectedPartitions, selectedNewState, selectedPartitionDetails, changePartitionState, fetchPartitions, toast]);

  // Table props
  const tableProps = {
    partitions: filteredPartitions,
    selectedPartitions,
    onSelectPartition: togglePartition,
    sortField,
    sortDirection,
    onSort: handleSort,
    onStateChange: handleStateChange,
  };

  if (partitionError) {
    return <BaseRing error={partitionError} ringName={'partition-ingester'} />;
  }

  return (
    <PageContainer>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.headerGrid}>
            <div className={styles.headerContent}>
              <div className={styles.titleSection}>
                <h2 className={styles.title}>Partition Ring Members</h2>
                <p className={styles.subtitle}>
                  View and manage partition ring instances with their current status and configuration
                </p>
              </div>
              <div className={styles.controls}>
                <RefreshLoop
                  onRefresh={fetchPartitions}
                  isPaused={selectedPartitions.size > 0}
                  isLoading={isPartitionsLoading}
                />
                {selectedPartitions.size > 0 && (
                  <div className={styles.selectedInfo}>
                    <span className={styles.selectedText}>
                      {selectedPartitions.size} partition
                      {selectedPartitions.size !== 1 ? 's' : ''} selected
                    </span>
                    <Select
                      value={selectedNewState}
                      onChange={(e) => setSelectedNewState(Number(e.currentTarget.value))}
                      width={20}
                    >
                      <option value="">Select new state</option>
                      {STATE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                    <Button
                      onClick={() => setIsStateChangeDialogOpen(true)}
                      disabled={isStateChangeLoading || !selectedNewState}
                      size="sm"
                      variant="secondary"
                    >
                      Change State
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div className={styles.chartContainer}>
              <div className={styles.chart}>
                <PartitionStateDistributionChart partitions={partitions} />
              </div>
            </div>
          </div>
        </div>
        <div className={styles.cardContent}>
          <PartitionRingFilters
            idFilter={idFilter}
            onIdFilterChange={setIdFilter}
            stateFilter={stateFilter}
            onStateFilterChange={setStateFilter}
            zoneFilter={zoneFilter}
            onZoneFilterChange={setZoneFilter}
            ownerFilter={ownerFilter}
            onOwnerFilterChange={setOwnerFilter}
            uniqueStates={uniqueStates}
            uniqueZones={uniqueZones}
            partitions={partitions}
          />
          <div className={styles.tableContainer}>
            <PartitionRingTable {...tableProps} />
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={isStateChangeDialogOpen}
        title="Confirm State Change"
        body={
          <div>
            <p>Are you sure you want to change the state of these partitions?</p>
            <div style={{ maxHeight: '300px', overflowY: 'auto', marginTop: '16px' }}>
              {Array.from(new Set(selectedPartitionDetails.map((p) => p.id))).map((partitionId) => {
                const partition = partitions.find((p) => p.id === partitionId);
                if (!partition) {
                  return null;
                }
                return (
                  <div key={partitionId} className={styles.modalPartition}>
                    <div className={styles.modalPartitionInfo}>
                      <span className={styles.modalPartitionLabel}>Partition {partitionId}</span>
                      <Badge
                        text={STATE_OPTIONS.find((opt) => opt.value === partition.state)?.label || 'Unknown'}
                        color={getStateColor(partition.state)}
                      />
                      <ArrowRightCircle size={16} />
                      <Badge
                        text={STATE_OPTIONS.find((opt) => opt.value === selectedNewState)?.label || 'Unknown'}
                        color={getStateColor(selectedNewState || 0)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        }
        confirmText={isStateChangeLoading ? 'Changing States...' : 'Confirm Changes'}
        dismissText="Cancel"
        onConfirm={handleStateChange}
        onDismiss={() => setIsStateChangeDialogOpen(false)}
      />
    </PageContainer>
  );
}
