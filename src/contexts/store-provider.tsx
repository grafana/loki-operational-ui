import React, { useContext, useState, ReactNode, useEffect } from 'react';
import { StoreContext } from './store-context';
import { StoreContextValue } from './types';
import { DataSourceInstanceSettings } from '@grafana/data';
import { getDataSourceSrv } from '@grafana/runtime';
import { getDefaultDatasource } from '../utils/datasource';

interface StoreProviderProps {
  children: ReactNode;
}

export function StoreProvider({ children }: StoreProviderProps) {
  const [selectedDatasource, setSelectedDatasource] = useState<DataSourceInstanceSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading] = useState(false);

  // Set default datasource on load
  useEffect(() => {
    const defaultDatasourceUid = getDefaultDatasource();

    if (defaultDatasourceUid) {
      try {
        const datasource = getDataSourceSrv().getInstanceSettings(defaultDatasourceUid);
        if (datasource) {
          setSelectedDatasource(datasource);
        }
      } catch (err) {
        setError('Failed to load default datasource');
      }
    }
  }, []);

  const contextValue: StoreContextValue = {
    selectedDatasource,
    error,
    isLoading,
    setSelectedDatasource: (datasource: DataSourceInstanceSettings | null) => {
      setSelectedDatasource(datasource);
      setError(null); // Clear any previous errors when setting a new datasource
    },
  };

  return <StoreContext.Provider value={contextValue}>{children}</StoreContext.Provider>;
}

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
