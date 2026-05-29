import { Cluster } from 'types/cluster';
import { DataSourceInstanceSettings } from '@grafana/data';

export interface ClusterContextValue {
  cluster: Cluster | null;
  error: string | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export interface StoreContextValue {
  selectedDatasource: DataSourceInstanceSettings | null;
  error: string | null;
  isLoading: boolean;
  setSelectedDatasource: (datasource: DataSourceInstanceSettings | null) => void;
}

