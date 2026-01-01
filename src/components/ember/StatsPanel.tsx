'use client';

import { BookOpen, CheckCircle, Clock } from 'lucide-react';
import styles from './StatsPanel.module.css';
import { Book, Universe } from '@/app/ember/books/page';

interface StatsPanelProps {
    universes: Universe[];
    allBooks: Book[];
}

export default function StatsPanel({ universes, allBooks }: StatsPanelProps) {
    const stats = {
        total: allBooks.length,
        read: allBooks.filter(b => b.status === 'read').length,
        unread: allBooks.filter(b => b.status === 'unread').length,
    };

    const completionPercentage = stats.total > 0 
        ? Math.round((stats.read / stats.total) * 100) 
        : 0;

    // Books by universe tag
    const universeTagCounts: Record<string, { total: number; read: number }> = {};
    allBooks.forEach(book => {
        const tag = book.universeTag || 'Untagged';
        if (!universeTagCounts[tag]) {
            universeTagCounts[tag] = { total: 0, read: 0 };
        }
        universeTagCounts[tag].total++;
        if (book.status === 'read') {
            universeTagCounts[tag].read++;
        }
    });

    const tagBreakdown = Object.entries(universeTagCounts)
        .filter(([tag]) => tag !== 'Untagged')
        .map(([tag, counts]) => ({ tag, ...counts }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

    // Recent activity (books with dates)
    const recentlyFinished = allBooks
        .filter(b => b.status === 'read' && b.dateFinished)
        .sort((a, b) => new Date(b.dateFinished!).getTime() - new Date(a.dateFinished!).getTime())
        .slice(0, 3);

    return (
        <div className={styles.statsPanel}>
            {/* Main stats row */}
            <div className={styles.mainStats}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                        <BookOpen size={22} />
                    </div>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>{stats.total}</span>
                        <span className={styles.statLabel}>Total</span>
                    </div>
                </div>

                <div className={`${styles.statCard} ${styles.readCard}`}>
                    <div className={styles.statIcon}>
                        <CheckCircle size={22} />
                    </div>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>{stats.read}</span>
                        <span className={styles.statLabel}>Read</span>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                        <Clock size={22} />
                    </div>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>{stats.unread}</span>
                        <span className={styles.statLabel}>To Read</span>
                    </div>
                </div>
            </div>

            {/* Progress bar */}
            <div className={styles.progressSection}>
                <div className={styles.progressHeader}>
                    <span>Progress</span>
                    <span className={styles.progressPercent}>{completionPercentage}%</span>
                </div>
                <div className={styles.progressBar}>
                    <div 
                        className={styles.progressFill} 
                        style={{ width: `${completionPercentage}%` }}
                    />
                </div>
            </div>

            {/* Tags breakdown + recent */}
            <div className={styles.secondaryStats}>
                {tagBreakdown.length > 0 && (
                    <div className={styles.tagBreakdown}>
                        {tagBreakdown.map(({ tag, total, read }) => (
                            <div key={tag} className={styles.tagItem}>
                                <span className={styles.tagName}>{tag}</span>
                                <span className={styles.tagCount}>{read}/{total}</span>
                            </div>
                        ))}
                    </div>
                )}

                {recentlyFinished.length > 0 && (
                    <div className={styles.recentSection}>
                        <span className={styles.recentLabel}>Recent:</span>
                        {recentlyFinished.map(book => (
                            <span key={book.id} className={styles.recentBook} title={book.title}>
                                {book.title.length > 20 ? book.title.slice(0, 20) + '...' : book.title}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
