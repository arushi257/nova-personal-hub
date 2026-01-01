'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './TopNav.module.css';

const navItems = [
  { path: '/', label: 'Nexus', icon: '🏠' },
  { path: '/ember', label: 'Ember', icon: '🐉' },
  { path: '/quark', label: 'Quark', icon: '🗒️' },
  { path: '/pulse', label: 'Pulse', icon: '🏃‍♀️' },
  { path: '/forge', label: 'Forge', icon: '🛠️' },
];

export default function TopNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      <div className={`${styles.container} glass-panel`}>
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            href={item.path}
            className={`${styles.link} ${pathname === item.path ? styles.active : ''}`}
            title={item.label}
          >
            {item.icon}
          </Link>
        ))}
      </div>
    </nav>
  );
}
