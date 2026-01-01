import Link from 'next/link';
import { Calendar, CheckSquare, Timer } from 'lucide-react';
import styles from './page.module.css';

export default function QuarkPage() {
    const modules = [
        {
            id: 'calendar',
            label: 'Calendar',
            icon: Calendar,
            href: '/quark/calendar',
            description: 'Plan waves of focus and lock in every milestone'
        },
        {
            id: 'todo',
            label: 'Todo',
            icon: CheckSquare,
            href: '/quark/todo',
            description: 'Keep your short-run tasks aligned with big ideas'
        },
        {
            id: 'pomodoro',
            label: 'Pomodoro',
            icon: Timer,
            href: '/quark/pomodoro',
            description: 'Pulse the day with timed bursts of attention'
        }
    ];

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Quark</h1>
                <p className={styles.subtitle}>Atomic Productivity</p>
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
