'use client';

import Link from 'next/link';
import type { ComponentType } from 'react';
import { Activity, Flag, Music, PenTool, Rocket, ServerCog, Zap } from 'lucide-react';

type Shortcut = {
  label: string;
  icon: ComponentType<{ size?: number; color?: string }>;
  href: string;
  color: string;
};

const defaultShortcuts: Shortcut[] = [
  { label: 'Guitar', icon: Music, href: '/ember/guitar', color: 'var(--color-ember-primary)' },
  { label: 'Notes', icon: PenTool, href: '/forge/notes', color: 'var(--color-forge-accent)' },
  { label: 'Habits', icon: Activity, href: '/pulse/habits', color: 'var(--color-pulse-accent)' },
  { label: 'Pomodoro', icon: Zap, href: '/quark/pomodoro', color: 'var(--color-quark-accent)' },
  { label: 'Services', icon: ServerCog, href: '#services', color: 'var(--color-nexus-accent)' },
  { label: 'Feature Flags', icon: Flag, href: '#feature-flags', color: 'var(--color-nexus-accent-2)' },
  { label: 'Deployments', icon: Rocket, href: '#services', color: 'var(--color-nexus-accent)' },
];

interface QuickLauncherProps {
  items?: Shortcut[];
}

export default function QuickLauncher({ items }: QuickLauncherProps) {
  const shortcuts = items ?? defaultShortcuts;

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', width: '280px' }}>
      <h3 style={{ 
        fontSize: '1.2rem', 
        marginBottom: '1rem', 
        color: 'var(--text-primary)' 
      }}>
        Quick Launch
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {shortcuts.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.75rem',
              borderRadius: '8px',
              background: 'var(--surface-hover)',
              border: '1px solid var(--border-secondary)',
              transition: 'all 0.2s ease',
              color: 'var(--text-primary)',
            }}
          >
            <item.icon size={20} color={item.color} />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
