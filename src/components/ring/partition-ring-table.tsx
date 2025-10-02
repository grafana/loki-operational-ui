import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PartitionInstance } from 'types/ring';
import { prefixRoute } from 'utils/utils.routing';
import { formatTimestamp, formatRelativeTime, getStateColor, getZoneColorIndex } from 'lib/ring-utils';
import { Checkbox, Badge, useStyles2, Button } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';
import { DataTableColumnHeader } from 'components/common/data-table-column-header';
import { RateWithTrend } from './rate-with-trend';

export type SortField = 'id' | 'state' | 'owner' | 'timestamp' | 'zone' | 'uncompressed_rate' | 'compressed_rate';

interface SelectAllCheckboxProps {
  allPartitions: PartitionInstance[];
  selectedIds: Set<number>;
  onChange: (selectedIds: Set<number>) => void;
}

function SelectAllCheckbox({ allPartitions, selectedIds, onChange }: SelectAllCheckboxProps) {
  // Get unique partition IDs from all partitions
  const uniquePartitionIds = useMemo(() => {
    return Array.from(new Set(allPartitions.map((p) => p.id)));
  }, [allPartitions]);

  const allSelected = uniquePartitionIds.every((id) => selectedIds.has(id));

  const handleChange = () => {
    if (allSelected) {
      // Unselect all partitions
      onChange(new Set());
    } else {
      // Select all unique partitions
      onChange(new Set(uniquePartitionIds));
    }
  };

  return (
    <Checkbox
      value={uniquePartitionIds.length > 0 && allSelected}
      onChange={handleChange}
      aria-label="Select all partitions"
    />
  );
}

interface PartitionRingTableProps {
  partitions: PartitionInstance[];
  selectedPartitions: Set<number>;
  onSelectPartition: (id: number) => void;
  sortField: SortField;
  sortDirection: 'asc' | 'desc';
  onSort: (field: SortField) => void;
  onStateChange: (partitionIds: number[], newState: number) => void;
  previousPartitions?: PartitionInstance[];
}

const STATE_OPTIONS = [
  { value: 1, label: 'Pending' },
  { value: 2, label: 'Active' },
  { value: 3, label: 'Inactive' },
  { value: 4, label: 'Deleted' },
];

const getStyles = (theme: GrafanaTheme2) => ({
  table: css`
    width: 100%;
    border-collapse: collapse;
  `,
  thead: css`
    background: ${theme.colors.background.secondary};
  `,
  th: css`
    padding: ${theme.spacing(1.5)};
    text-align: left;
    font-weight: ${theme.typography.fontWeightMedium};
    color: ${theme.colors.text.secondary};
    border-bottom: 1px solid ${theme.colors.border.weak};
  `,
  tr: css`
    border-bottom: 1px solid ${theme.colors.border.weak};
    &:hover {
      background: ${theme.colors.background.secondary};
    }
  `,
  trNoHover: css`
    border-bottom: 1px solid ${theme.colors.border.weak};
  `,
  td: css`
    padding: ${theme.spacing(1.5)};
    color: ${theme.colors.text.primary};
  `,
  zoneBadge: css`
    display: inline-flex;
    align-items: center;
    padding: ${theme.spacing(0.5, 1)};
    border-radius: ${theme.shape.radius.default};
    font-size: ${theme.typography.bodySmall.fontSize};
    font-weight: ${theme.typography.fontWeightMedium};
  `,
  partitionBadge: css`
    display: inline-flex;
    align-items: center;
    padding: ${theme.spacing(0.5, 1)};
    border-radius: ${theme.shape.radius.default};
    font-size: ${theme.typography.bodySmall.fontSize};
    font-weight: ${theme.typography.fontWeightMedium};
    background: ${theme.colors.background.secondary};
  `,
  partitionBadgeCorrupted: css`
    display: inline-flex;
    align-items: center;
    padding: ${theme.spacing(0.5, 1)};
    border-radius: ${theme.shape.radius.default};
    font-size: ${theme.typography.bodySmall.fontSize};
    font-weight: ${theme.typography.fontWeightMedium};
    background: ${theme.colors.error.transparent};
    color: ${theme.colors.error.text};
  `,
  link: css`
    color: ${theme.colors.text.link};
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  `,
  fontMedium: css`
    font-weight: ${theme.typography.fontWeightMedium};
  `,
  textMuted: css`
    color: ${theme.colors.text.secondary};
  `,
  noResults: css`
    padding: ${theme.spacing(3)};
    text-align: center;
    color: ${theme.colors.text.secondary};
  `,
});

// Map zone color index to Badge color
const ZONE_BADGE_COLORS: Array<'blue' | 'green' | 'red' | 'orange' | 'purple'> = [
  'red',
  'orange',
  'orange',
  'green',
  'green',
  'blue',
  'blue',
  'purple',
];

function getZoneBadgeColor(zone: string): 'blue' | 'green' | 'red' | 'orange' | 'purple' {
  const index = getZoneColorIndex(zone);
  return ZONE_BADGE_COLORS[index % ZONE_BADGE_COLORS.length];
}

export function PartitionRingTable({
  partitions,
  selectedPartitions,
  onSelectPartition,
  sortField,
  sortDirection,
  onSort,
}: PartitionRingTableProps) {
  const styles = useStyles2(getStyles);
  // Sort partitions according to the current sort field
  const sortedPartitions = useMemo(() => {
    return [...partitions].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'uncompressed_rate': {
          comparison = (a.uncompressedRate || 0) - (b.uncompressedRate || 0);
          break;
        }
        case 'compressed_rate': {
          comparison = (a.compressedRate || 0) - (b.compressedRate || 0);
          break;
        }
        case 'id':
          comparison = a.id - b.id;
          break;
        case 'state':
          comparison = a.state - b.state;
          break;
        case 'owner':
          comparison = a.owner_id?.localeCompare(b.owner_id || '') || 0;
          break;
        case 'zone':
          comparison = (a.zone || '').localeCompare(b.zone || '');
          break;
        case 'timestamp':
          comparison = new Date(a.state_timestamp).getTime() - new Date(b.state_timestamp).getTime();
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [partitions, sortField, sortDirection]);

  return (
    <table className={styles.table}>
      <thead className={styles.thead}>
        <tr className={styles.trNoHover}>
          <th className={styles.th} style={{ width: '50px' }}>
            <SelectAllCheckbox
              allPartitions={partitions}
              selectedIds={selectedPartitions}
              onChange={(newSelection) => {
                const uniqueIds = new Set(partitions.map((p) => p.id));
                uniqueIds.forEach((id) => {
                  if (newSelection.has(id) !== selectedPartitions.has(id)) {
                    onSelectPartition(id);
                  }
                });
              }}
            />
          </th>
          <th className={styles.th} style={{ width: '200px' }}>
            <DataTableColumnHeader<SortField>
              title="Owner"
              field="owner"
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={onSort}
            />
          </th>
          <th className={styles.th} style={{ width: '150px' }}>
            <DataTableColumnHeader<SortField>
              title="Zone"
              field="zone"
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={onSort}
            />
          </th>
          <th className={styles.th} style={{ width: '100px' }}>
            <DataTableColumnHeader<SortField>
              title="Partition ID"
              field="id"
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={onSort}
            />
          </th>
          <th className={styles.th} style={{ width: '150px' }}>
            <DataTableColumnHeader<SortField>
              title="State"
              field="state"
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={onSort}
            />
          </th>
          <th className={styles.th} style={{ width: '200px' }}>
            <DataTableColumnHeader<SortField>
              title="Last Update"
              field="timestamp"
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={onSort}
            />
          </th>
          <th className={styles.th} style={{ width: '150px' }}>
            <DataTableColumnHeader<SortField>
              title="Uncompressed Rate"
              field="uncompressed_rate"
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={onSort}
            />
          </th>
          <th className={styles.th} style={{ width: '150px' }}>
            <DataTableColumnHeader<SortField>
              title="Compressed Rate"
              field="compressed_rate"
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={onSort}
            />
          </th>
          <th className={styles.th} style={{ width: '100px' }} />
        </tr>
      </thead>
      <tbody>
        {sortedPartitions.map((partition) => {
          return (
            <tr key={`${partition.owner_id}-${partition.id}`} className={styles.tr}>
              <td className={styles.td}>
                <Checkbox
                  checked={selectedPartitions.has(partition.id)}
                  onChange={() => onSelectPartition(partition.id)}
                  aria-label={`Select partition ${partition.id}`}
                />
              </td>
              <td className={`${styles.td} ${styles.fontMedium}`}>
                <Link to={prefixRoute(`nodes/${partition.owner_id}`)} className={styles.link}>
                  {partition.owner_id}
                </Link>
              </td>
              <td className={styles.td}>
                <Badge text={partition.zone || '-'} color={getZoneBadgeColor(partition.zone || '')} />
              </td>
              <td className={styles.td}>
                <span
                  className={partition.corrupted ? styles.partitionBadgeCorrupted : styles.partitionBadge}
                  title={partition.corrupted ? 'Corrupted' : undefined}
                >
                  {partition.id}
                </span>
              </td>
              <td className={styles.td}>
                <Badge
                  text={STATE_OPTIONS.find((opt) => opt.value === partition.state)?.label || 'Unknown'}
                  color={getStateColor(partition.state)}
                />
              </td>
              <td className={styles.td}>
                <span title={formatTimestamp(partition.state_timestamp)} className={styles.textMuted}>
                  {formatRelativeTime(partition.state_timestamp)}
                </span>
              </td>
              <td className={styles.td}>
                <RateWithTrend currentRate={partition.uncompressedRate || 0} />
              </td>
              <td className={styles.td}>
                <RateWithTrend currentRate={partition.compressedRate || 0} />
              </td>
              <td className={styles.td}>
                <Link to={prefixRoute(`nodes/${partition.owner_id}`)}>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon="arrow-right"
                    tooltip="View instance details"
                  />
                </Link>
              </td>
            </tr>
          );
        })}
        {sortedPartitions.length === 0 && (
          <tr className={styles.trNoHover}>
            <td colSpan={9} className={styles.noResults}>
              No partitions found
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
