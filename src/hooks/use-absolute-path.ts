import { useCallback } from 'react';
import { useStore } from '../contexts/store-provider';
import { getBasename } from '../util';

export function absolutePath(path: string, datasourceUid: string): string {
  const basename = getBasename();

  // Remove leading slash from apiPath to avoid double slashes in final URL
  const cleanBaseName = basename.startsWith('/') ? basename.slice(1) : basename;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `/${cleanBaseName}api/datasources/proxy/uid/${datasourceUid}/ui/${cleanPath}`;
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
