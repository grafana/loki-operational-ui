import { useAbsolutePath } from './use-absolute-path';
import { useState, useEffect } from 'react';

interface NodeMetrics {
  store_object_type?: string;
  distributor_replication_factor?: number;
  [key: string]: string | number | boolean | undefined;
}

interface NodeDetails {
  services: Array<{ service: string; status: string }>;
  build: {
    version: string;
    revision: string;
    branch: string;
    buildUser: string;
    buildDate: string;
    goVersion: string;
  };
  config: string;
  target: string;
  clusterID: string;
  clusterSeededAt: number;
  os: string;
  arch: string;
  edition: string;
  metrics: NodeMetrics;
}

interface UseNodeDetailsResult {
  nodeDetails: NodeDetails | null;
  isLoading: boolean;
  error: string | null;
}

export function useNodeDetails(nodeName: string | undefined): UseNodeDetailsResult {
  const [nodeDetails, setNodeDetails] = useState<NodeDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const absolutePath = useAbsolutePath();

  useEffect(() => {
    if (!nodeName) {
      setError('Node name is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    fetch(absolutePath(`/api/v1/cluster/nodes/${nodeName}/details`))
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch node details: ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        data.target = data.config.match(/target:\s*([^\n]+)/)?.[1]?.trim() || '';
        setNodeDetails(data);
        setIsLoading(false);
      })
      .catch((error) => {
        setError(error instanceof Error ? error.message : 'An error occurred');
        setIsLoading(false);
      });
  }, [nodeName, absolutePath]);

  return {
    nodeDetails,
    isLoading,
    error,
  };
}
