export type ServiceStatus = 'healthy' | 'degraded' | 'offline';

export type ServiceAction = 'deploy' | 'restart';

export interface ServiceInfo {
  id: string;
  name: string;
  version: string;
  status: ServiceStatus;
  lastDeployAt: string;
  endpoint: string;
  description?: string;
}

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  owner?: string;
  updatedAt: string;
}

