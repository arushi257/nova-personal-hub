import Link from 'next/link';
import { Activity, DollarSign, Plane, Newspaper } from 'lucide-react';
import styles from './page.module.css';

export default function PulsePage() {
    const modules = [
        {
            id: 'habits',
            label: 'Habits',
            icon: Activity,
            href: '/pulse/habits',
            description: 'Track streaks and move toward steady growth'
        },
        {
            id: 'finances',
            label: 'Finances',
            icon: DollarSign,
            href: '/pulse/finances',
            description: 'Keep your balance sheet aligned with your rhythm'
        },
        {
            id: 'travel',
            label: 'Travel',
            icon: Plane,
            href: '/pulse/travel',
            description: 'Log routes and experiences worth revisiting'
        },
        {
            id: 'news',
            label: 'News',
            icon: Newspaper,
            href: '/pulse/news',
            description: 'Scan the world pulse before you act'
        }
    ];

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Pulse</h1>
                <p className={styles.subtitle}>Rhythm of Life</p>
            </header>

            <div className={styles.grid}>
                {modules.map((mod) => (
                    <Link
                        key={mod.id}
                        href={mod.href}
                        className={styles.card}
                        data-type={mod.id}
                    >
                        <div className={styles.iconWrapper}>
                            <mod.icon size={48} strokeWidth={1.5} />
                        </div>
                        <span className={styles.label}>{mod.label}</span>
                        <p className={styles.description}>{mod.description}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
