'use client';

import { Plus } from 'lucide-react';
import styles from './FranchiseShelf.module.css';
import CollectionRow from './CollectionRow';

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

interface Franchise {
    id: string;
    name: string;
    type: 'movie-franchise' | 'tv-show';
    collections: Collection[];
    icon: string;
}

interface Props {
    franchise: Franchise;
    onMovieClick: (movie: Movie, collectionId: string) => void;
    onAddCollection: () => void;
    onAddMovie: (collectionId: string) => void;
    onReorder: (collectionId: string, fromIndex: number, toIndex: number) => void;
}

export default function FranchiseShelf({ franchise, onMovieClick, onAddCollection, onAddMovie, onReorder }: Props) {
    return (
        <div className={styles.shelf}>
            <div className={styles.shelfHeader}>
                <div className={styles.shelfTitle}>
                    <span className={styles.icon}>{franchise.icon}</span>
                    <h2>{franchise.name}</h2>
                    <span className={styles.type}>{franchise.type === 'tv-show' ? 'TV Show' : 'Movie Franchise'}</span>
                </div>
                <button className={styles.addBtn} onClick={onAddCollection} title="Add Collection">
                    <Plus size={18} />
                </button>
            </div>

            <div className={styles.collections}>
                {franchise.collections.map(collection => (
                    <CollectionRow
                        key={collection.id}
                        collection={collection}
                        onMovieClick={(movie) => onMovieClick(movie, collection.id)}
                        onAddMovie={() => onAddMovie(collection.id)}
                        onReorder={(from, to) => onReorder(collection.id, from, to)}
                    />
                ))}
            </div>
        </div>
    );
}
