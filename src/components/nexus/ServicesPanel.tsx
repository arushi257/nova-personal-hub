'use client';

import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, CheckCircle2, RefreshCcw, ServerCog } from 'lucide-react';
import { fetchServices, performServiceAction } from '@/lib/nexus/client';
import { ServiceAction, ServiceInfo, ServiceStatus } from '@/lib/nexus/types';

type ActionState = Record<string, ServiceAction | null>;

const statusMeta: Record<ServiceStatus, { label: string; color: string; background: string; icon: JSX.Element }> = {
  healthy: {
    label: 'Healthy',
    color: 'var(--color-nexus-accent)',
    background: 'var(--shadow-glow)',
    icon: <CheckCircle2 size={16} color="var(--color-nexus-accent)" />,
  },
  degraded: {
    label: 'Degraded',
    color: '#f5a524',
    background: 'rgba(245, 165, 36, 0.12)',
    icon: <AlertTriangle size={16} color="#f5a524" />,
  },
  offline: {
    label: 'Offline',
    color: '#f87171',
    background: 'rgba(248, 113, 113, 0.12)',
    icon: <AlertTriangle size={16} color="#f87171" />,
  },
};

export default function ServicesPanel() {
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioning, setActioning] = useState<ActionState>({});

  const sortedServices = useMemo(
    () => [...services].sort((a, b) => a.name.localeCompare(b.name)),
    [services],
  );

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchServices();
        if (active) {
          setServices(data);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load services';
        setError(message);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const handleAction = async (service: ServiceInfo, action: ServiceAction) => {
    const confirmed = window.confirm(`Confirm ${action} for ${service.name}?`);
    if (!confirmed) return;

    setActioning((prev) => ({ ...prev, [service.id]: action }));
    try {
      const updated = await performServiceAction(service.id, action);
      setServices((prev) => prev.map((item) => (item.id === service.id ? updated : item)));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to perform action';
      setError(message);
    } finally {
      setActioning((prev) => ({ ...prev, [service.id]: null }));
    }
  };

  return (
    <div id="services" className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ServerCog size={18} color="var(--color-nexus-accent)" />
          <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)' }}>Services</h3>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            fetchServices()
              .then(setServices)
              .catch((err) => setError(err instanceof Error ? err.message : 'Unable to refresh'))
              .finally(() => setLoading(false));
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.45rem 0.75rem',
            borderRadius: '8px',
            border: '1px solid var(--border-primary)',
            background: 'var(--surface-hover)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
          }}
        >
          <RefreshCcw size={14} />
          Refresh
        </button>
      </div>

      {error && (
        <div style={{ color: '#f87171', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              style={{
                height: '88px',
                borderRadius: '10px',
                background: 'var(--surface-hover)',
                animation: 'pulse 1.4s ease-in-out infinite',
              }}
            />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          {sortedServices.map((service) => {
            const status = statusMeta[service.status];
            const isActioning = actioning[service.id];
            return (
              <div
                key={service.id}
                style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border-primary)',
                  background: 'var(--surface-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{service.name}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{service.version}</span>
                  </div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.3rem 0.55rem',
                      borderRadius: '999px',
                      fontSize: '0.8rem',
                      color: status.color,
                      background: status.background,
                    }}
                  >
                    {status.icon}
                    {status.label}
                  </span>
                </div>

                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
                  {service.description}
                </p>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <span>Last deploy {formatDistanceToNow(new Date(service.lastDeployAt), { addSuffix: true })}</span>
                  <span style={{ opacity: 0.5 }}>•</span>
                  <span style={{ wordBreak: 'break-all' }}>{service.endpoint}</span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleAction(service, 'deploy')}
                    disabled={!!isActioning}
                    style={primaryButtonStyle}
                  >
                    {isActioning === 'deploy' ? 'Deploying…' : 'Deploy'}
                  </button>
                  <button
                    onClick={() => handleAction(service, 'restart')}
                    disabled={!!isActioning}
                    style={ghostButtonStyle}
                  >
                    {isActioning === 'restart' ? 'Restarting…' : 'Restart'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const primaryButtonStyle: CSSProperties = {
  flex: 1,
  padding: '0.65rem 0.75rem',
  borderRadius: '8px',
  border: '1px solid var(--color-nexus-accent)',
  background: 'var(--shadow-glow)',
  color: 'var(--text-primary)',
  cursor: 'pointer',
  fontWeight: 500,
};

const ghostButtonStyle: CSSProperties = {
  flex: 1,
  padding: '0.65rem 0.75rem',
  borderRadius: '8px',
  border: '1px solid var(--border-primary)',
  background: 'var(--surface-hover)',
  color: 'var(--text-primary)',
  cursor: 'pointer',
};
