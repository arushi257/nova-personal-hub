import { FeatureFlag, ServiceAction, ServiceInfo } from './types';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Request failed');
  }
  return response.json() as Promise<T>;
}

export async function fetchServices(): Promise<ServiceInfo[]> {
  const res = await fetch('/api/nexus/services', { cache: 'no-store' });
  const data = await handleResponse<{ services: ServiceInfo[] }>(res);
  return data.services;
}

export async function performServiceAction(id: string, action: ServiceAction): Promise<ServiceInfo> {
  const res = await fetch('/api/nexus/services', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, action }),
  });
  const data = await handleResponse<{ service: ServiceInfo }>(res);
  return data.service;
}

export async function fetchFeatureFlags(): Promise<FeatureFlag[]> {
  const res = await fetch('/api/nexus/feature-flags', { cache: 'no-store' });
  const data = await handleResponse<{ flags: FeatureFlag[] }>(res);
  return data.flags;
}

export async function updateFeatureFlag(key: string, enabled: boolean): Promise<FeatureFlag> {
  const res = await fetch('/api/nexus/feature-flags', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, enabled }),
  });
  const data = await handleResponse<{ flag: FeatureFlag }>(res);
  return data.flag;
}

