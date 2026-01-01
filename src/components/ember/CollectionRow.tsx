'use client';

import { useState } from 'react';
import styles from './CollectionRow.module.css';
import MovieCard from './MovieCard';

interface Movie {
    id: string;
    title: string;
    type: 'movie' | 'episode';
    watched: boolean;
    rating?: number;
    runtime?: number;
    releaseYear?: number;
    genre?: string[];
    director?: string;
    notes?: string;
    watchDate?: string;
}

interface Collection {
    id: string;
    name: string;
    movies: Movie[];
}

interface Props {
    collection: Collection;
    onMovieClick: (movie: Movie) => void;
    onAddMovie: () => void;
}

export default function CollectionRow({ collection, onMovieClick, onAddMovie, onReorder }: Props & { onReorder: (fromIndex: number, toIndex: number) => void }) {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        // Optional: Could implement visual reordering preview here
    };

    const handleDrop = (targetIndex: number) => {
        if (draggedIndex !== null && draggedIndex !== targetIndex) {
            onReorder(draggedIndex, targetIndex);
        }
        setDraggedIndex(null);
    };

    return (
        <div className={styles.row}>
            <div className={styles.collectionHeader}>
                <h3 className={styles.collectionName}>{collection.name}</h3>
                <button className={styles.addMovieBtn} onClick={onAddMovie} title="Add Movie">
                    +
                </button>
            </div>
            <div className={styles.movieGrid}>
                {collection.movies.map((movie, index) => (
                    <div
                        key={movie.id}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={() => handleDrop(index)}
                        className={`${styles.dragWrapper} ${draggedIndex === index ? styles.dragging : ''}`}
                    >
                        <MovieCard
                            movie={movie}
                            onClick={() => onMovieClick(movie)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
