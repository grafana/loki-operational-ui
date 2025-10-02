import React from 'react';
import { NodeState, ALL_NODE_STATES } from '../../types/cluster';
import { Button, Input, useStyles2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';
import { MultiSelect } from 'components/common/multi-select';
import { RefreshCw } from 'lucide-react';

interface NodeFiltersProps {
  nameFilter: string;
  targetFilter: string[];
  selectedStates: NodeState[];
  onNameFilterChange: (value: string) => void;
  onTargetFilterChange: (value: string[]) => void;
  onStatesChange: (states: NodeState[]) => void;
  onRefresh: () => void;
  availableTargets: string[];
  isLoading?: boolean;
}

const NodeFilters: React.FC<NodeFiltersProps> = ({
  nameFilter,
  targetFilter,
  selectedStates,
  onNameFilterChange,
  onTargetFilterChange,
  onStatesChange,
  onRefresh,
  availableTargets,
}) => {
  const styles = useStyles2(getStyles);

  const stateOptions = ALL_NODE_STATES.map((state) => ({
    label: state,
    value: state,
  }));

  const handleStateChange = (values: string[]) => {
    onStatesChange(values as NodeState[]);
  };

  return (
    <div className={styles.container}>
      <div className={styles.nodeFilters}>
        <div className={styles.filterGroup}>
          <label className={styles.label}>Node filters</label>
          <Input
            value={nameFilter}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onNameFilterChange(e.target.value)}
            placeholder="Filter by node name..."
            width={40}
          />
          <MultiSelect
            options={availableTargets.map((target) => ({
              value: target,
              label: target,
            }))}
            selected={targetFilter}
            onChange={onTargetFilterChange}
            placeholder="All Targets"
            className={styles.multiSelect}
          />
        </div>
      </div>
      <div className={styles.stateFilters}>
        <label className={styles.label}>Service states</label>
        <MultiSelect
          options={stateOptions}
          selected={selectedStates}
          onChange={handleStateChange}
          placeholder="Filter nodes by service states..."
          className={styles.multiSelectFull}
        />
      </div>
      <div className={styles.refreshButton}>
        <Button onClick={onRefresh} size="sm" variant="secondary" icon="sync">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: ${theme.spacing(2)} ${theme.spacing(2)};
  `,
  nodeFilters: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(1)};
  `,
  filterGroup: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(1.5)};
  `,
  label: css`
    font-size: ${theme.typography.bodySmall.fontSize};
    font-weight: ${theme.typography.fontWeightMedium};
    color: ${theme.colors.text.secondary};
  `,
  stateFilters: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(1.5)};
    align-self: end;
  `,
  multiSelect: css`
    width: 300px;
  `,
  multiSelectFull: css`
    width: 100%;
    min-width: 300px;
  `,
  refreshButton: css`
    align-self: end;
  `,
});

export default NodeFilters;
