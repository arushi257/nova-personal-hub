import Link from 'next/link';
import { Lightbulb, NotebookPen, Table } from 'lucide-react';
import styles from './page.module.css';

export default function ForgePage() {
    const modules = [
        {
            id: 'ideas',
            label: 'Ideas',
            icon: Lightbulb,
            href: '/forge/ideas',
            description: 'Capture sparks of inspiration before they cool.'
        },
        {
            id: 'notes',
            label: 'Notes',
            icon: NotebookPen,
            href: '/forge/notes',
            description: 'Reforge raw thinking into structured insight.'
        },
        {
            id: 'sheet',
            label: 'Sheet',
            icon: Table,
            href: '/forge/sheet',
            description: 'Track builds, priorities, and the metal in between.'
        }
    ];

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Forge</h1>
                <p className={styles.subtitle}>Craft & Create</p>
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
