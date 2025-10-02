import React from 'react';
import { DataSourcePicker } from '@grafana/runtime';
import { Field, FieldSet, useStyles2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';
import { useStore } from '../contexts/store-provider';

const getStyles = (theme: GrafanaTheme2) => ({
  fieldSet: css({
    width: 300,
  }),
  errorMessage: css({
    color: theme.colors.error.text,
    fontSize: 12,
    marginTop: 4,
  }),
});

interface DatasourcePickerComponentProps {
  placeholder?: string;
  width?: number;
  disabled?: boolean;
}

export function DatasourcePickerComponent({
  placeholder = 'Select datasource',
  width = 300,
  disabled = false,
}: DatasourcePickerComponentProps) {
  const { selectedDatasource, setSelectedDatasource, error } = useStore();
  const styles = useStyles2(getStyles);

  return (
    <FieldSet className={styles.fieldSet}>
      <Field label={'Data source'}>
        <div>
          <DataSourcePicker
            current={selectedDatasource}
            onChange={setSelectedDatasource}
            placeholder={placeholder}
            width={width}
            disabled={disabled}
            filter={(ds) => ds.type === 'loki'}
          />
          {error && <div className={styles.errorMessage}>{error}</div>}
        </div>
      </Field>
    </FieldSet>
  );
}
