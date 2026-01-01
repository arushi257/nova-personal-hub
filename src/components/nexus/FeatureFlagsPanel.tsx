'use client';

import type { ChangeEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Filter, ToggleLeft, ToggleRight } from 'lucide-react';
import { fetchFeatureFlags, updateFeatureFlag } from '@/lib/nexus/client';
import { FeatureFlag } from '@/lib/nexus/types';

export default function FeatureFlagsPanel() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setError(null);
      try {
        const data = await fetchFeatureFlags();
        if (active) {
          setFlags(data);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load feature flags';
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

  const filteredFlags = useMemo(() => {
    const q = query.toLowerCase();
    return flags.filter((flag) => flag.name.toLowerCase().includes(q) || flag.key.toLowerCase().includes(q));
  }, [flags, query]);

  const handleQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const toggle = async (flag: FeatureFlag) => {
    const nextEnabled = !flag.enabled;
    setUpdatingKey(flag.key);
    setError(null);
    setFlags((prev) => prev.map((item) => (item.key === flag.key ? { ...item, enabled: nextEnabled } : item)));
    try {
      const updated = await updateFeatureFlag(flag.key, nextEnabled);
      setFlags((prev) => prev.map((item) => (item.key === flag.key ? updated : item)));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update feature flag';
      setError(message);
      setFlags((prev) => prev.map((item) => (item.key === flag.key ? flag : item)));
    } finally {
      setUpdatingKey(null);
    }
  };

  return (
    <div id="feature-flags" className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={18} color="var(--color-nexus-accent)" />
          <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)' }}>Feature Flags</h3>
        </div>
        <input
          value={query}
          onChange={handleQueryChange}
          placeholder="Search flags"
          style={{
            background: 'var(--surface-card-solid)',
            border: '1px solid var(--border-primary)',
            borderRadius: '8px',
            padding: '0.5rem 0.75rem',
            color: 'var(--text-primary)',
            minWidth: '180px',
          }}
        />
      </div>

      {error && <div style={{ color: '#f87171', fontSize: '0.9rem' }}>{error}</div>}

      {loading ? (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              style={{
                height: '72px',
                borderRadius: '10px',
                background: 'var(--surface-hover)',
                animation: 'pulse 1.4s ease-in-out infinite',
              }}
            />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {filteredFlags.map((flag) => (
            <div
              key={flag.key}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                border: '1px solid var(--border-primary)',
                background: 'var(--surface-card)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{flag.name}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{flag.key}</span>
                </div>
                <button
                  onClick={() => toggle(flag)}
                  disabled={updatingKey === flag.key}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '999px',
                    border: '1px solid var(--border-primary)',
                    background: flag.enabled ? 'var(--shadow-glow)' : 'var(--surface-hover)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    minWidth: '118px',
                    justifyContent: 'center',
                  }}
                >
                  {flag.enabled ? <ToggleRight size={18} color="var(--color-nexus-accent)" /> : <ToggleLeft size={18} />}
                  {updatingKey === flag.key ? 'Saving…' : flag.enabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', margin: 0 }}>{flag.description}</p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <span>Owner: {flag.owner ?? 'Unassigned'}</span>
                <span style={{ opacity: 0.5 }}>•</span>
                <span>Updated {formatDistanceToNow(new Date(flag.updatedAt), { addSuffix: true })}</span>
              </div>
            </div>
          ))}
          {!filteredFlags.length && (
            <div style={{ padding: '1rem', borderRadius: '10px', border: '1px dashed var(--border-primary)', textAlign: 'center', color: 'var(--text-muted)' }}>
              No flags match &quot;{query}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
