import React, { useMemo, useState } from 'react';
import { useCluster } from 'contexts/use-cluster';
import { ServiceNames } from 'lib/ring-utils';
import { findNodeName } from 'lib/utils';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { prefixRoute } from 'utils/utils.routing';
import { fromUnixTime, formatDistance, format } from 'date-fns';
import { DataTableColumnHeader } from 'components/common/data-table-column-header';
import { DateHover } from 'components/common/date-hover';
import { PageContainer } from 'layout/page-container';
import { absolutePath } from '../util';
import { Card, Input, useStyles2, Alert, LoadingPlaceholder, Button, Badge } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

interface DeleteRequest {
  request_id: string;
  start_time: number;
  end_time: number;
  query: string;
  status: string;
  created_at: number;
  user_id: string;
  deleted_lines: number;
}

const DeleteRequestStatus = {
  Received: 'received',
  Processing: 'processed',
} as const;

const getStyles = (theme: GrafanaTheme2) => ({
  pageContainer: css({
    padding: '24px',
  }),
  headerContainer: css({
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  }),
  filtersContainer: css({
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  }),
  filterGroup: css({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  }),
  filterLabel: css({
    fontSize: 14,
    fontWeight: 500,
  }),
  toggleGroup: css({
    display: 'flex',
    gap: 4,
  }),
  toggleItem: css({
    padding: '8px 16px',
    border: `1px solid ${theme.colors.border.weak}`,
    backgroundColor: theme.colors.background.primary,
    color: theme.colors.text.primary,
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': {
      backgroundColor: theme.colors.background.secondary,
    },
    '&[data-state="on"]': {
      backgroundColor: theme.colors.primary.main,
      color: theme.colors.primary.contrastText,
    },
  }),
  searchInput: css({
    width: 300,
  }),
  contentContainer: css({
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  }),
  tableContainer: css({
    borderRadius: theme.shape.radius.default,
    border: `1px solid ${theme.colors.border.weak}`,
    backgroundColor: theme.colors.background.primary,
    overflow: 'hidden',
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
    fontSize: 12,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }),
  tableRow: css({
    borderBottom: `1px solid ${theme.colors.border.weak}`,
    '&:hover': {
      backgroundColor: theme.colors.background.secondary,
    },
  }),
  tableCell: css({
    padding: 12,
    fontSize: 14,
  }),
  codeCell: css({
    fontFamily: theme.typography.fontFamilyMonospace,
    fontSize: 12,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  }),
  emptyState: css({
    height: 96,
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.colors.text.secondary,
  }),
  loadingContainer: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  }),
  hoverCard: css({
    cursor: 'default',
  }),
  hoverCardContent: css({
    width: 'fit-content',
  }),
  hoverCardInner: css({
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  }),
  hoverCardRow: css({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  }),
  hoverCardLabel: css({
    padding: '2px 8px',
    fontSize: 12,
    fontWeight: 500,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.shape.radius.default,
    width: 56,
    textAlign: 'center',
  }),
  hoverCardValue: css({
    fontFamily: theme.typography.fontFamilyMonospace,
  }),
});

const useDeletes = (status: string[]) => {
  const { cluster } = useCluster();
  const nodeName = useMemo(() => {
    return findNodeName(cluster?.members, ServiceNames.compactor);
  }, [cluster?.members]);

  const { data, isLoading, error } = useQuery<DeleteRequest[]>({
    queryKey: ['deletes', status, nodeName],
    queryFn: async () => {
      try {
        const requests = await Promise.all(
          status.map(async (s) => {
            const response = await fetch(
              absolutePath(`/api/v1/proxy/${nodeName}/compactor/ui/api/v1/deletes?status=${s}`)
            );
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(errorText || `HTTP error! status: ${response.status}`);
            }
            return response.json();
          })
        );
        // Flatten the array of arrays into a single array of delete requests
        return requests.flat();
      } catch (err) {
        throw err instanceof Error ? err : new Error('Failed to fetch delete requests');
      }
    },
    enabled: !!nodeName,
  });

  return { data, isLoading, error };
};

interface FiltersProps {
  selectedStatus: string[];
  onStatusChange: (status: string[]) => void;
  queryFilter: string;
  onQueryFilterChange: (query: string) => void;
}

const Filters: React.FC<FiltersProps> = ({ selectedStatus, onStatusChange, queryFilter, onQueryFilterChange }) => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.filtersContainer}>
      <div className={styles.filterGroup}>
        <span className={styles.filterLabel}>Status</span>
        <div className={styles.toggleGroup}>
          {Object.entries(DeleteRequestStatus).map(([key, value]) => (
            <button
              key={value}
              className={`${styles.toggleItem} ${selectedStatus.includes(value) ? 'data-state-on' : ''}`}
              onClick={() => {
                const newStatus = selectedStatus.includes(value)
                  ? selectedStatus.filter((s) => s !== value)
                  : [...selectedStatus, value];
                // Ensure at least one status is always selected
                if (newStatus.length > 0) {
                  onStatusChange(newStatus);
                }
              }}
              aria-label={`Toggle ${key.toLowerCase()} status`}
            >
              {key}
            </button>
          ))}
        </div>
      </div>
      <Input
        type="search"
        placeholder="Filter by query..."
        value={queryFilter}
        onChange={(e) => onQueryFilterChange((e.target as HTMLInputElement).value)}
        className={styles.searchInput}
      />
    </div>
  );
};

type DeleteSortField = 'status' | 'user' | 'createdAt' | 'duration';

interface DeleteListProps {
  requests: DeleteRequest[];
  sortField: DeleteSortField;
  sortDirection: 'asc' | 'desc';
  onSort: (field: DeleteSortField) => void;
}

const StatusBadge = ({ status }: { status: string }) => {
  const isReceived = status === DeleteRequestStatus.Received;

  return <Badge text={status} color={isReceived ? 'orange' : 'green'} />;
};

const RangeHover = ({ start, end }: { start: number; end: number }) => {
  const styles = useStyles2(getStyles);
  const duration = formatDistance(fromUnixTime(start / 1000), fromUnixTime(end / 1000));

  const formatUTC = (timestamp: number) => {
    const date = new Date(timestamp);
    return format(new Date(date.getTime() + date.getTimezoneOffset() * 60000), 'yyyy-MM-dd HH:mm:ss');
  };

  return (
    <div className={styles.hoverCard}>
      <span className={styles.hoverCard}>{duration}</span>
      <div className={styles.hoverCardContent}>
        <div className={styles.hoverCardInner}>
          <div className={styles.hoverCardRow}>
            <span className={styles.hoverCardLabel}>From</span>
            <span className={styles.hoverCardValue}>{formatUTC(start)}</span>
          </div>
          <div className={styles.hoverCardRow}>
            <span className={styles.hoverCardLabel}>To</span>
            <span className={styles.hoverCardValue}>{formatUTC(end)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const DeleteList: React.FC<DeleteListProps> = ({ requests, sortField, sortDirection, onSort }) => {
  const styles = useStyles2(getStyles);

  const sortedRequests = [...requests].sort((a, b) => {
    let comparison = 0;
    let durationA: number;
    let durationB: number;

    switch (sortField) {
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'user':
        comparison = a.user_id.localeCompare(b.user_id);
        break;
      case 'createdAt':
        comparison = a.created_at - b.created_at;
        break;
      case 'duration':
        durationA = a.end_time - a.start_time;
        durationB = b.end_time - b.start_time;
        comparison = durationA - durationB;
        break;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr className={styles.tableHeader}>
            <th className={styles.tableHeaderCell} style={{ width: 80 }}>
              <DataTableColumnHeader<DeleteSortField>
                title="Status"
                field="status"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={onSort}
              />
            </th>
            <th className={styles.tableHeaderCell} style={{ width: 100 }}>
              <DataTableColumnHeader<DeleteSortField>
                title="User"
                field="user"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={onSort}
              />
            </th>
            <th className={styles.tableHeaderCell} style={{ width: 200 }}>
              <DataTableColumnHeader<DeleteSortField>
                title="Created At"
                field="createdAt"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={onSort}
              />
            </th>
            <th className={styles.tableHeaderCell} style={{ width: 150 }}>
              <DataTableColumnHeader<DeleteSortField>
                title="Range"
                field="duration"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={onSort}
              />
            </th>
            <th className={styles.tableHeaderCell} style={{ width: 100 }}>
              Deleted Lines
            </th>
            <th className={styles.tableHeaderCell}>Query</th>
          </tr>
        </thead>
        <tbody>
          {sortedRequests.map((request) => (
            <tr key={`${request.request_id}-${request.start_time}-${request.end_time}`} className={styles.tableRow}>
              <td className={styles.tableCell}>
                <StatusBadge status={request.status} />
              </td>
              <td className={styles.tableCell}>{request.user_id}</td>
              <td className={styles.tableCell}>
                <DateHover date={new Date(request.created_at)} />
              </td>
              <td className={styles.tableCell}>
                <RangeHover start={request.start_time} end={request.end_time} />
              </td>
              <td className={styles.tableCell}>{request.deleted_lines}</td>
              <td className={styles.tableCell}>
                <code className={styles.codeCell}>{request.query}</code>
              </td>
            </tr>
          ))}
          {sortedRequests.length === 0 && (
            <tr>
              <td colSpan={6} className={styles.emptyState}>
                <div>No delete requests found</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const DeletesPage = () => {
  const styles = useStyles2(getStyles);
  const [status, setStatus] = useState<string[]>([DeleteRequestStatus.Received, DeleteRequestStatus.Processing]);
  const [queryFilter, setQueryFilter] = useState('');
  const [sortField, setSortField] = useState<DeleteSortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const { data, isLoading, error } = useDeletes(status);

  const filteredData = useMemo(() => {
    if (!data || !queryFilter) {
      return data;
    }
    return data.filter((request) => request.query.toLowerCase().includes(queryFilter.toLowerCase()));
  }, [data, queryFilter]);

  const handleSort = (field: DeleteSortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <PageContainer>
      <div className={styles.pageContainer}>
        <Card>
          <Card.Heading>Delete Requests</Card.Heading>
          <Card.Meta>View and manage delete requests in your cluster</Card.Meta>
          <Card.Tags>
            <Link to={prefixRoute('tenants/deletes/new')}>
              <Button icon="plus">New Delete Request</Button>
            </Link>
          </Card.Tags>
          <Card.Description>
            <div className={styles.headerContainer}>
              <Filters
                selectedStatus={status}
                onStatusChange={setStatus}
                queryFilter={queryFilter}
                onQueryFilterChange={setQueryFilter}
              />
            </div>
          </Card.Description>
        </Card>

        <div className={styles.contentContainer}>
          {error && (
            <Alert severity="error" title="Error">
              {error.message}
            </Alert>
          )}

          {isLoading && (
            <div className={styles.loadingContainer}>
              <LoadingPlaceholder text="Loading delete requests..." />
            </div>
          )}

          {!isLoading && !error && filteredData && (
            <DeleteList
              requests={filteredData}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default DeletesPage;
