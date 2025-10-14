import { useCallback } from 'react';
import { useStore } from '../contexts/store-provider';
import { getBasename } from '../util';

export function absolutePath(path: string, datasourceUid: string): string {
  const basename = getBasename();
  const apiPath = `${basename}${path.startsWith('/') ? path.slice(1) : path}`;

  // Remove leading slash from apiPath to avoid double slashes in final URL
  const cleanApiPath = apiPath.startsWith('/') ? apiPath.slice(1) : apiPath;
  return `/api/datasources/proxy/uid/${datasourceUid}/${cleanApiPath}`;
}

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
