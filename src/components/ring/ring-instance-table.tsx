import React from 'react';
import { Link } from 'react-router-dom';
import { RingInstance } from 'types/ring';
import { prefixRoute } from 'utils/utils.routing';
import { formatRelativeTime, formatTimestamp, getZoneColorIndex } from 'lib/ring-utils';
import { Checkbox, Badge, useStyles2, Button } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';
import { DataTableColumnHeader } from 'components/common/data-table-column-header';

export type SortField = 'id' | 'state' | 'address' | 'zone' | 'timestamp' | 'ownership' | 'tokens';

interface SelectAllCheckboxProps {
  visibleIds: string[];
  selectedIds: Set<string>;
  onChange: (selectedIds: Set<string>) => void;
}

function SelectAllCheckbox({ visibleIds, selectedIds, onChange }: SelectAllCheckboxProps) {
  const allVisibleSelected = visibleIds.every((id) => selectedIds.has(id));

  const handleChange = () => {
    const visibleIdsSet = new Set(visibleIds);
    if (allVisibleSelected) {
      // Keep only the instances that are not currently visible
      onChange(new Set([...selectedIds].filter((id) => !visibleIdsSet.has(id))));
    } else {
      // Add all visible instances to the current selection
      onChange(new Set([...selectedIds, ...visibleIds]));
    }
  };

  return (
    <Checkbox
      value={visibleIds.length > 0 && allVisibleSelected}
      onChange={handleChange}
      aria-label="Select all visible instances"
    />
  );
}

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
  ownershipContainer: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(0.5)};
  `,
  ownershipInfo: css`
    display: flex;
    justify-content: space-between;
    font-size: ${theme.typography.bodySmall.fontSize};
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

// Map state string to Badge color
function getStateBadgeColor(state: string): 'blue' | 'green' | 'red' | 'orange' | 'purple' {
  const upperState = state.toUpperCase();
  if (upperState.includes('ACTIVE') || upperState.includes('JOINING')) {
    return 'green';
  }
  if (upperState.includes('PENDING') || upperState.includes('LEAVING')) {
    return 'orange';
  }
  if (upperState.includes('UNHEALTHY')) {
    return 'orange';
  }
  if (upperState.includes('LEFT')) {
    return 'red';
  }
  return 'orange';
}

interface RingInstanceTableProps {
  instances: RingInstance[];
  selectedInstances: Set<string>;
  onSelectInstance: (instanceId: string) => void;
  sortField: SortField;
  sortDirection: 'asc' | 'desc';
  onSort: (field: SortField) => void;
  showTokens?: boolean;
}

export function RingInstanceTable({
  instances,
  selectedInstances,
  onSelectInstance,
  sortField,
  sortDirection,
  onSort,
  showTokens = false,
}: RingInstanceTableProps) {
  const styles = useStyles2(getStyles);

  return (
    <table className={styles.table}>
      <thead className={styles.thead}>
        <tr className={styles.trNoHover}>
          <th className={styles.th} style={{ width: '50px' }}>
            <SelectAllCheckbox
              visibleIds={instances.map((instance) => instance.id)}
              selectedIds={selectedInstances}
              onChange={(newSelection) => {
                instances.forEach((instance) => {
                  if (newSelection.has(instance.id) !== selectedInstances.has(instance.id)) {
                    onSelectInstance(instance.id);
                  }
                });
              }}
            />
          </th>
          <th className={styles.th} style={{ width: '200px' }}>
            <DataTableColumnHeader<SortField>
              title="ID"
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
          <th className={styles.th}>
            <DataTableColumnHeader<SortField>
              title="Address"
              field="address"
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={onSort}
            />
          </th>
          {showTokens && (
            <th className={styles.th} style={{ width: '200px' }}>
              <DataTableColumnHeader<SortField>
                title="Ownership"
                field="ownership"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={onSort}
              />
            </th>
          )}
          <th className={styles.th} style={{ width: '150px' }}>
            <DataTableColumnHeader<SortField>
              title="Zone"
              field="zone"
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={onSort}
            />
          </th>
          <th className={styles.th} style={{ width: '200px' }}>
            <DataTableColumnHeader<SortField>
              title="Last Heartbeat"
              field="timestamp"
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={onSort}
            />
          </th>
          <th className={styles.th} style={{ width: '50px' }} />
        </tr>
      </thead>
      <tbody>
        {instances.map((instance) => {
          const ownership = showTokens ? instance.ownership : 0;
          const ownershipValue = typeof ownership === 'number' ? ownership : parseFloat(ownership);
          return (
            <tr key={instance.id} className={styles.tr}>
              <td className={styles.td}>
                <Checkbox
                  checked={selectedInstances.has(instance.id)}
                  onChange={() => onSelectInstance(instance.id)}
                  aria-label={`Select instance ${instance.id}`}
                />
              </td>
              <td className={`${styles.td} ${styles.fontMedium}`}>
                <Link to={prefixRoute(`nodes/${instance.id}`)} className={styles.link}>
                  {instance.id}
                </Link>
              </td>
              <td className={styles.td}>
                <Badge text={instance.state} color={getStateBadgeColor(instance.state)} />
              </td>
              <td className={styles.td}>{instance.address}</td>
              {showTokens && (
                <td className={styles.td}>
                  <div className={styles.ownershipContainer}>
                    <div className={styles.ownershipInfo}>
                      <span>{ownership}</span>
                      <span className={styles.textMuted}>{instance.tokens.length} tokens</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 mt-1">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${ownershipValue}%` }}
                      />
                    </div>
                  </div>
                </td>
              )}
              <td className={styles.td}>
                {instance.zone ? (
                  <Badge text={instance.zone} color={getZoneBadgeColor(instance.zone)} />
                ) : (
                  <span className={styles.textMuted}>-</span>
                )}
              </td>
              <td className={styles.td}>
                <span title={formatTimestamp(instance.timestamp)} className={styles.textMuted}>
                  {formatRelativeTime(instance.timestamp)}
                </span>
              </td>
              <td className={styles.td}>
                <Link to={prefixRoute(`nodes/${instance.id}`)}>
                  <Button variant="secondary" size="sm" icon="arrow-right" tooltip="View instance details" />
                </Link>
              </td>
            </tr>
          );
        })}
        {instances.length === 0 && (
          <tr className={styles.trNoHover}>
            <td colSpan={showTokens ? 8 : 7} className={styles.noResults}>
              No instances found
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
