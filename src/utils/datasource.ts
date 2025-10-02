import { getDataSourceSrv } from '@grafana/runtime';

export function getDefaultDatasource(): string | undefined {
  const ds = getDataSourceSrv()
    .getList({
      type: 'loki',
    })
    .find((ds) => ds.isDefault);
  return ds?.uid;
}
