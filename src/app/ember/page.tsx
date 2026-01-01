import Link from 'next/link';
import { Guitar, BookOpen, Clapperboard, Brain } from 'lucide-react';
import styles from './page.module.css';

export default function EmberPage() {
    const modules = [
        {
            id: 'guitar',
            label: 'Guitar',
            icon: Guitar,
            href: '/ember/guitar',
            description: 'Strum your way to mastery'
        },
        {
            id: 'books',
            label: 'Books',
            icon: BookOpen,
            href: '/ember/books',
            description: 'Library of wisdom'
        },
        {
            id: 'visuals',
            label: 'Movies',
            icon: Clapperboard,
            href: '/ember/visuals',
            description: 'Cinema & TV log'
        },
        {
            id: 'teasers',
            label: 'Brain Teasers',
            icon: Brain,
            href: '/ember/teasers',
            description: 'Challenge your mind'
        },
    ];

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Ember</h1>
                <p className={styles.subtitle}>Ignite your curiosity</p>
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
