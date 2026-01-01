import { FeatureFlag, ServiceAction, ServiceInfo, ServiceStatus } from '@/lib/nexus/types';

const now = new Date();

const baseServices: ServiceInfo[] = [
  {
    id: 'nova-api',
    name: 'Nova API',
    version: 'v2.8.3',
    status: 'healthy',
    lastDeployAt: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(),
    endpoint: 'https://api.nova.internal',
    description: 'Primary backend for dashboard data and operational actions.',
  },
  {
    id: 'pulse-stream',
    name: 'Pulse Stream',
    version: 'v1.5.1',
    status: 'degraded',
    lastDeployAt: new Date(now.getTime() - 1000 * 60 * 60 * 6).toISOString(),
    endpoint: 'https://pulse-stream.internal',
    description: 'Event stream and metrics ingestion.',
  },
  {
    id: 'forge-notes',
    name: 'Forge Notes',
    version: 'v1.2.0',
    status: 'healthy',
    lastDeployAt: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(),
    endpoint: 'https://notes.forge.internal',
    description: 'Note-taking and documentation service.',
  },
  {
    id: 'wings-ui',
    name: 'Wings UI',
    version: 'v0.9.4',
    status: 'offline',
    lastDeployAt: new Date(now.getTime() - 1000 * 60 * 60 * 10).toISOString(),
    endpoint: 'https://wings-ui.internal',
    description: 'Edge UI layer for fast interactions.',
  },
];

const baseFeatureFlags: FeatureFlag[] = [
  {
    key: 'nexus:dark-mode-sync',
    name: 'Dark Mode Sync',
    description: 'Synchronize theme with device settings.',
    enabled: true,
    owner: 'UX',
    updatedAt: new Date(now.getTime() - 1000 * 60 * 35).toISOString(),
  },
  {
    key: 'nexus:quick-launch-pin',
    name: 'Quick Launch Pinning',
    description: 'Allow pinning custom shortcuts to dashboard.',
    enabled: false,
    owner: 'Platform',
    updatedAt: new Date(now.getTime() - 1000 * 60 * 90).toISOString(),
  },
  {
    key: 'pulse:live-refresh',
    name: 'Pulse Live Refresh',
    description: 'Auto-refresh Pulse metrics every 30 seconds.',
    enabled: true,
    owner: 'Data',
    updatedAt: new Date(now.getTime() - 1000 * 60 * 120).toISOString(),
  },
  {
    key: 'nova:zero-downtime',
    name: 'Nova Zero Downtime',
    description: 'Enable zero-downtime deploy path for Nova API.',
    enabled: false,
    owner: 'SRE',
    updatedAt: new Date(now.getTime() - 1000 * 60 * 240).toISOString(),
  },
];

export function getServices(): ServiceInfo[] {
  return baseServices.map((svc) => ({ ...svc }));
}

export function getFeatureFlags(): FeatureFlag[] {
  return baseFeatureFlags.map((flag) => ({ ...flag }));
}

function toHealthyStatus(current: ServiceStatus, action: ServiceAction): ServiceStatus {
  if (action === 'restart' && current === 'offline') return 'degraded';
  return 'healthy';
}

export function performServiceAction(id: string, action: ServiceAction): ServiceInfo {
  const index = baseServices.findIndex((svc) => svc.id === id);
  if (index === -1) {
    throw new Error('Service not found');
  }

  const service = baseServices[index];

  const updatedStatus = toHealthyStatus(service.status, action);
  const updated = {
    ...service,
    status: updatedStatus,
    lastDeployAt: new Date().toISOString(),
  };

  baseServices[index] = updated;
  return { ...updated };
}

export function toggleFeatureFlag(key: string, enabled: boolean): FeatureFlag {
  const index = baseFeatureFlags.findIndex((item) => item.key === key);
  if (index === -1) {
    throw new Error('Feature flag not found');
  }

  const flag = baseFeatureFlags[index];

  const updated = {
    ...flag,
    enabled,
    updatedAt: new Date().toISOString(),
  };

  baseFeatureFlags[index] = updated;
  return { ...updated };
}

