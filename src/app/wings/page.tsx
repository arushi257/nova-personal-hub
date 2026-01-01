'use client';

import Link from 'next/link';
import type { ComponentType, CSSProperties } from 'react';
import {
  Music,
  Book,
  Tv,
  Brain,
  Timer,
  CheckSquare,
  Calendar,
  Activity,
  DollarSign,
  Map,
  FileText,
  PenTool,
  Lightbulb,
  LayoutGrid,
  Flame,
  Atom,
  Zap,
  Hammer,
} from 'lucide-react';
import styles from './page.module.css';

interface AppItem {
  label: string;
  href: string;
  icon: ComponentType<{ size?: number }>;
}

interface Section {
  name: string;
  icon: ComponentType<{ size?: number }>;
  accent: string;
  apps: AppItem[];
}

const sections: Section[] = [
  {
    name: 'Ember',
    icon: Flame,
    accent: '#E63946',
    apps: [
      { label: 'Guitar', icon: Music, href: '/ember/guitar' },
      { label: 'Books', icon: Book, href: '/ember/books' },
      { label: 'Visuals', icon: Tv, href: '/ember/visuals' },
      { label: 'Brain Teasers', icon: Brain, href: '/ember/teasers' },
    ],
  },
  {
    name: 'Quark',
    icon: Atom,
    accent: '#2F80ED',
    apps: [
      { label: 'Pomodoro', icon: Timer, href: '/quark/pomodoro' },
      { label: 'To-Do', icon: CheckSquare, href: '/quark/todo' },
      { label: 'Calendar', icon: Calendar, href: '/quark/calendar' },
    ],
  },
  {
    name: 'Pulse',
    icon: Zap,
    accent: '#27AE60',
    apps: [
      { label: 'Habits', icon: Activity, href: '/pulse/habits' },
      { label: 'Finances', icon: DollarSign, href: '/pulse/finances' },
      { label: 'Travel', icon: Map, href: '/pulse/travel' },
      { label: 'News', icon: FileText, href: '/pulse/news' },
    ],
  },
  {
    name: 'Forge',
    icon: Hammer,
    accent: '#F2C94C',
    apps: [
      { label: 'Notes', icon: PenTool, href: '/forge/notes' },
      { label: 'Ideas', icon: Lightbulb, href: '/forge/ideas' },
      { label: 'Sheet', icon: LayoutGrid, href: '/forge/sheet' },
    ],
  },
];

export default function WingsPage() {
  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Wings</h1>
        <p className={styles.pageSubtitle}>Quick access to all areas</p>
      </header>

      <div className={styles.grid}>
        {sections.map((section) => {
          const SectionIcon = section.icon;
          return (
            <section
              key={section.name}
              className={styles.section}
              style={{ '--accent': section.accent } as CSSProperties}
            >
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIconWrapper}>
                  <SectionIcon size={20} />
                </div>
                <h2 className={styles.sectionName}>{section.name}</h2>
              </div>

              <div className={styles.appList}>
                {section.apps.map((app) => {
                  const AppIcon = app.icon;
                  return (
                    <Link key={app.label} href={app.href} className={styles.appItem}>
                      <span className={styles.appIcon}>
                        <AppIcon size={18} />
                      </span>
                      <span className={styles.appLabel}>{app.label}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
