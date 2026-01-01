'use client';

import { Plus } from 'lucide-react';
import styles from './UniverseBookshelf.module.css';
import SeriesShelf from './SeriesShelf';

interface Book {
    id: string;
    title: string;
    author?: string;
    read: boolean;
    rating?: number;
    quotes?: string[];
    notes?: string;
    files?: string[];
}

interface Series {
    id: string;
    name: string;
    books: Book[];
}

interface Universe {
    id: string;
    name: string;
    icon: string;
    series: Series[];
}

interface Props {
    universe: Universe;
    onBookClick: (book: Book, seriesId: string) => void;
    onAddSeries: () => void;
    onAddBook: (seriesId: string) => void;
}

// Calculate shelf size based on book count
function getShelfSize(bookCount: number): 'small' | 'medium' | 'large' | 'extra-large' {
    if (bookCount === 0) return 'small';
    if (bookCount <= 3) return 'small';
    if (bookCount <= 6) return 'medium';
    if (bookCount <= 12) return 'large';
    return 'extra-large';
}

export default function UniverseBookshelf({ universe, onBookClick, onAddSeries, onAddBook }: Props) {
    return (
        <div className={styles.bookshelf}>
            <div className={styles.header}>
                <div className={styles.headerContent}>
                    <span className={styles.icon}>{universe.icon}</span>
                    <h2 className={styles.name}>{universe.name}</h2>
                </div>
                <button className={styles.addSeriesBtn} onClick={onAddSeries} title="Add Series">
                    <Plus size={18} />
                    Add Series
                </button>
            </div>

            <div className={styles.frame}>
                <div className={styles.grid}>
                    {universe.series.map(series => (
                        <SeriesShelf
                            key={series.id}
                            series={series}
                            onBookClick={(book) => onBookClick(book, series.id)}
                            onAddBook={() => onAddBook(series.id)}
                            size={getShelfSize(series.books.length)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
