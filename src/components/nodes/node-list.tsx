import React from 'react';
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { Member } from 'types/cluster';
import StatusBadge from 'components/nodes/status-badge';
import { ReadinessIndicator } from 'components/nodes/readiness-indicator';
import { DataTableColumnHeader } from 'components/common/data-table-column-header';
import { Button, useStyles2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';
import { ArrowRightCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { prefixRoute } from 'utils/utils.routing';

type NodeSortField = 'name' | 'target' | 'version' | 'buildDate';

interface NodeListProps {
  nodes: { [key: string]: Member };
  sortField: NodeSortField;
  sortDirection: 'asc' | 'desc';
  onSort: (field: NodeSortField) => void;
}

interface NodeRowProps {
  name: string;
  node: Member;
  onNavigate: (name: string) => void;
}

const formatBuildDate = (dateStr: string) => {
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) {
      return 'Invalid date';
    }
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.warn('Error parsing date:', dateStr, error);
    return 'Invalid date';
  }
};

const NodeRow: React.FC<NodeRowProps> = ({ name, node, onNavigate }) => {
  const styles = useStyles2(getRowStyles);

  return (
    <tr key={name} className={styles.row} onClick={() => onNavigate(name)}>
      <td className={styles.cellMedium}>{name}</td>
      <td className={styles.cell}>{node.target}</td>
      <td className={styles.cellMono}>{node.build.version}</td>
      <td className={styles.cell}>{formatBuildDate(node.build.buildDate)}</td>
      <td className={styles.cell}>
        <StatusBadge services={node.services} error={node.error} />
      </td>
      <td className={styles.cell}>
        <ReadinessIndicator isReady={node.ready?.isReady} message={node.ready?.message} />
      </td>
      <td className={styles.cell}>
        <Button
          variant="secondary"
          size="sm"
          fill="text"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(name);
          }}
        >
          <ArrowRightCircle className="h-4 w-4" />
          <span className="sr-only">View details</span>
        </Button>
      </td>
    </tr>
  );
};

const NodeList: React.FC<NodeListProps> = ({ nodes, sortField, sortDirection, onSort }) => {
  const navigate = useNavigate();

  const compareDates = (dateStrA: string, dateStrB: string) => {
    const dateA = parseISO(dateStrA);
    const dateB = parseISO(dateStrB);
    if (!isValid(dateA) && !isValid(dateB)) {
      return 0;
    }
    if (!isValid(dateA)) {
      return 1;
    }
    if (!isValid(dateB)) {
      return -1;
    }
    return dateA.getTime() - dateB.getTime();
  };

  const sortedNodes = Object.entries(nodes).sort(([aKey, a], [bKey, b]) => {
    let comparison = 0;
    switch (sortField) {
      case 'name':
        comparison = aKey.localeCompare(bKey);
        break;
      case 'target':
        comparison = a.target.localeCompare(b.target);
        break;
      case 'version':
        comparison = a.build.version.localeCompare(b.build.version);
        break;
      case 'buildDate':
        comparison = compareDates(a.build.buildDate, b.build.buildDate);
        break;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleNavigate = (name: string) => {
    navigate(prefixRoute(`nodes/${name}`));
  };

  const styles = useStyles2(getTableStyles);

  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead>
          <tr className={styles.headerRow}>
            <th className={styles.headerCell} style={{ width: '300px' }}>
              <DataTableColumnHeader<NodeSortField>
                title="Node Name"
                field="name"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={onSort}
              />
            </th>
            <th className={styles.headerCell} style={{ width: '200px' }}>
              <DataTableColumnHeader<NodeSortField>
                title="Target"
                field="target"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={onSort}
              />
            </th>
            <th className={styles.headerCell} style={{ width: '200px' }}>
              <DataTableColumnHeader<NodeSortField>
                title="Version"
                field="version"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={onSort}
              />
            </th>
            <th className={styles.headerCell} style={{ width: '200px' }}>
              <DataTableColumnHeader<NodeSortField>
                title="Build Date"
                field="buildDate"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={onSort}
              />
            </th>
            <th className={styles.headerCell} style={{ width: '150px' }}>
              Status
            </th>
            <th className={styles.headerCell} style={{ width: '50px' }}>
              Ready
            </th>
            <th className={styles.headerCell} style={{ width: '100px' }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedNodes.map(([name, node]) => (
            <NodeRow key={name} name={name} node={node} onNavigate={handleNavigate} />
          ))}
          {sortedNodes.length === 0 && (
            <tr>
              <td colSpan={7} className={styles.emptyCell}>
                <div className={styles.emptyText}>No nodes found</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const getTableStyles = (theme: GrafanaTheme2) => ({
  container: css`
    border-radius: ${theme.shape.radius.default};
    border: 1px solid ${theme.colors.border.weak};
    background: ${theme.colors.background.primary};
    overflow: hidden;
  `,
  table: css`
    width: 100%;
    border-collapse: collapse;
  `,
  headerRow: css`
    background: ${theme.colors.background.secondary};
  `,
  headerCell: css`
    padding: ${theme.spacing(1.5)};
    text-align: left;
    font-weight: ${theme.typography.fontWeightMedium};
    color: ${theme.colors.text.primary};
    border-bottom: 1px solid ${theme.colors.border.weak};
  `,
  emptyCell: css`
    padding: ${theme.spacing(3)};
    text-align: center;
  `,
  emptyText: css`
    color: ${theme.colors.text.secondary};
  `,
});

const getRowStyles = (theme: GrafanaTheme2) => ({
  row: css`
    cursor: pointer;
    &:hover {
      background: ${theme.colors.background.secondary};
    }
  `,
  cell: css`
    padding: ${theme.spacing(1.5)};
    border-bottom: 1px solid ${theme.colors.border.weak};
  `,
  cellMedium: css`
    padding: ${theme.spacing(1.5)};
    border-bottom: 1px solid ${theme.colors.border.weak};
    font-weight: ${theme.typography.fontWeightMedium};
  `,
  cellMono: css`
    padding: ${theme.spacing(1.5)};
    border-bottom: 1px solid ${theme.colors.border.weak};
    font-family: ${theme.typography.fontFamilyMonospace};
    font-size: ${theme.typography.bodySmall.fontSize};
  `,
});

export default NodeList;
