import { RingType, RingTypes } from 'types/ring';
import { formatDistanceToNowStrict, formatISO } from 'date-fns';
import { findNodeName, hasService } from './utils';
import { absolutePath } from '../util';

export function formatRelativeTime(timestamp: string) {
  const date = new Date(timestamp);
  return `${formatDistanceToNowStrict(date)} ago`;
}

export function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  return formatISO(date, { format: 'extended' });
}

// Returns Grafana theme color names for state badges
export function getStateColor(state: string | number): 'blue' | 'green' | 'red' | 'orange' | 'purple' {
  const numericState = typeof state === 'string' ? parseInt(state, 10) : state;
  switch (numericState) {
    case 2: // Active
      return 'green';
    case 1: // Pending
      return 'orange';
    case 3: // Inactive
      return 'orange';
    case 4: // Deleted
      return 'red';
    default: // Unknown
      return 'orange';
  }
}

// Hash function for consistent zone colors
function hashZone(zone: string): number {
  return zone.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
}

export function getZoneColorIndex(zone: string): number {
  return Math.abs(hashZone(zone)) % 8;
}

export function parseZoneFromOwner(owner: string): string {
  const parts = owner.split('-');
  return parts.length >= 3 ? parts[parts.length - 2] : '';
}

export function getFirstZoneFromOwners(owners: string[]): string {
  if (!owners.length) {
    return '';
  }
  return parseZoneFromOwner(owners[0]);
}

export function formatBytes(bytes: number): string {
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

interface Member {
  services?: Array<{ service: string }>;
}

// Helper function to check if a service exists in any member
export const clusterSupportService = (members: Record<string, Member>, serviceName: string): boolean => {
  return Object.values(members).some((member) => hasService(member, serviceName));
};

export const ServiceNames = {
  ingester: 'ingester',
  'partition-ring': 'partition-ring',
  distributor: 'distributor',
  'pattern-ingester': 'pattern-ingester',
  'query-scheduler': 'query-scheduler',
  compactor: 'compactor',
  ruler: 'ruler',
  'index-gateway': 'index-gateway',
};

export const RingServices: Record<
  string,
  { title: string; ringName: RingType; ringPath: string; needsTokens: boolean }
> = {
  ingester: {
    title: 'Ingester',
    ringName: RingTypes.INGESTER,
    ringPath: '/ring',
    needsTokens: true,
  },
  'partition-ring': {
    title: 'Partition Ingester',
    ringName: RingTypes.PARTITION_INGESTER,
    ringPath: '/partition-ring',
    needsTokens: true,
  },
  distributor: {
    title: 'Distributor',
    ringName: RingTypes.DISTRIBUTOR,
    ringPath: '/distributor/ring',
    needsTokens: false,
  },
  'ingest-limits-frontend': {
    title: 'Ingest Limits Frontend',
    ringName: RingTypes.INGEST_LIMITS_FRONTEND,
    ringPath: '/ingest-limits-frontend/ring',
    needsTokens: false,
  },
  'ingest-limits': {
    title: 'Ingest Limits',
    ringName: RingTypes.INGEST_LIMITS,
    ringPath: '/ingest-limits/ring',
    needsTokens: false,
  },
  'pattern-ingester': {
    title: 'Pattern Ingester',
    ringName: RingTypes.PATTERN_INGESTER,
    ringPath: '/pattern/ring',
    needsTokens: true,
  },
  'query-scheduler': {
    title: 'Scheduler',
    ringName: RingTypes.QUERY_SCHEDULER,
    ringPath: '/scheduler/ring',
    needsTokens: false,
  },
  compactor: {
    title: 'Compactor',
    ringName: RingTypes.COMPACTOR,
    ringPath: '/compactor/ring',
    needsTokens: false,
  },
  ruler: {
    title: 'Ruler',
    ringName: RingTypes.RULER,
    ringPath: '/ruler/ring',
    needsTokens: true,
  },
  'index-gateway': {
    title: 'Index Gateway',
    ringName: RingTypes.INDEX_GATEWAY,
    ringPath: '/indexgateway/ring',
    needsTokens: true,
  },
};

function findServiceName(ringType: RingType) {
  return Object.keys(RingServices).find((key) => RingServices[key].ringName === ringType);
}

// Function to determine if a ring type needs tokens
export function needsTokens(ringName: RingType | undefined): boolean {
  if (!ringName) {
    return false;
  }
  const serviceName = findServiceName(ringName);
  if (!serviceName) {
    return false;
  }
  return RingServices[serviceName].needsTokens;
}

// Helper function to get available rings based on cluster services
export const getAvailableRings = (members: Record<string, Member>): Array<{ title: string; url: string }> => {
  const rings: Array<{ title: string; url: string }> = [];

  if (!members) {
    return rings;
  }

  // loop through services type an push to rigns

  for (const service in RingServices) {
    if (clusterSupportService(members, service)) {
      rings.push({
        title: RingServices[service].title,
        url: `rings/${RingServices[service].ringName}`,
      });
    }
  }
  return rings;
};

// Utility function to get ring proxy path
export function getRingProxyPath(members: Record<string, Member> | undefined, ringName: RingType): string {
  if (!members) {
    return '';
  }
  if (!ringName) {
    return '';
  }

  const serviceName = findServiceName(ringName);
  if (!serviceName) {
    return '';
  }
  // Find the first member that has the serviceName
  const nodeName = findNodeName(members, serviceName);
  if (!nodeName) {
    return '';
  }

  const proxyPath = absolutePath(`/api/v1/proxy/${nodeName}`);
  const ringPath = RingServices[serviceName].ringPath;
  const tokensParam = RingServices[serviceName].needsTokens ? '?tokens=true' : '';
  return `${proxyPath}${ringPath}${tokensParam}`;
}
