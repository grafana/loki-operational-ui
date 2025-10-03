import { useCallback } from 'react';
import { useStore } from '../contexts/store-provider';
import { absolutePath } from '../util';

/**
 * React hook that returns a bound version of absolutePath using the selected datasource
 * Falls back to 'loki' if no datasource is selected
 */
export function useAbsolutePath() {
  const { selectedDatasource } = useStore();

  return useCallback(
    (path: string) => {
      const uid = selectedDatasource?.uid || 'loki';
      return absolutePath(path, uid);
    },
    [selectedDatasource?.uid]
  );
}
