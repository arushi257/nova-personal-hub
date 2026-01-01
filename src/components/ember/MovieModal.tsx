'use client';

import { X, Trash2, ArrowRightLeft } from 'lucide-react'; // Added icons
import { useState } from 'react';
import styles from './MovieModal.module.css';

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
    poster?: string;
    plot?: string;
    imdbID?: string;
}

interface Collection {
    id: string;
    name: string;
}

interface Franchise {
    id: string;
    name: string;
    collections: Collection[];
}

interface Props {
    movie: Movie;
    onClose: () => void;
    onMarkWatched: (watched: boolean) => void;
    onRate: (rating: number) => void;
    onDelete: () => void;
    onMove: (franchiseId: string, collectionId: string) => void;
    franchises: Franchise[];
    currentFranchiseId: string;
    currentCollectionId: string;
}

export default function MovieModal({
    movie,
    onClose,
    onMarkWatched,
    onRate,
    onDelete,
    onMove,
    franchises,
    currentFranchiseId,
    currentCollectionId
}: Props) {
    const [isMoving, setIsMoving] = useState(false);
    const [targetFranchiseId, setTargetFranchiseId] = useState(currentFranchiseId);
    const [targetCollectionId, setTargetCollectionId] = useState(currentCollectionId);
    const formatRuntime = (minutes?: number) => {
        if (!minutes) return 'Unknown';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}>
                    <X size={24} />
                </button>

                <div className={styles.header}>
                    {movie.poster && (
                        <div className={styles.posterWrapper}>
                            <img src={movie.poster} alt={movie.title} className={styles.poster} />
                        </div>
                    )}
                    <div className={styles.headerInfo}>
                        <h2 className={styles.title}>{movie.title}</h2>
                        <span className={styles.type}>{movie.type === 'movie' ? '🎬 Movie' : '📺 Episode'}</span>
                        {movie.plot && <p className={styles.plot}>{movie.plot}</p>}
                    </div>
                </div>

                <div className={styles.content}>
                    {/* Rating Section */}
                    <div className={styles.section}>
                        <h3>Rating</h3>
                        <div className={styles.stars}>
                            {[1, 2, 3, 4, 5].map(star => (
                                <button
                                    key={star}
                                    className={`${styles.star} ${movie.rating && star <= movie.rating ? styles.filled : ''}`}
                                    onClick={() => onRate(star)}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Movie Details */}
                    <div className={styles.details}>
                        <div className={styles.detailItem}>
                            <span className={styles.label}>Runtime:</span>
                            <span className={styles.value}>{formatRuntime(movie.runtime)}</span>
                        </div>
                        {movie.releaseYear && (
                            <div className={styles.detailItem}>
                                <span className={styles.label}>Release Year:</span>
                                <span className={styles.value}>{movie.releaseYear}</span>
                            </div>
                        )}
                        {movie.director && (
                            <div className={styles.detailItem}>
                                <span className={styles.label}>Director:</span>
                                <span className={styles.value}>{movie.director}</span>
                            </div>
                        )}
                        {movie.genre && movie.genre.length > 0 && (
                            <div className={styles.detailItem}>
                                <span className={styles.label}>Genre:</span>
                                <div className={styles.genres}>
                                    {movie.genre.map(g => (
                                        <span key={g} className={styles.genreTag}>{g}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Watched Status */}
                    <div className={styles.section}>
                        <h3>Actions</h3>
                        <div className={styles.watchButtons}>
                            {movie.watched ? (
                                <>
                                    <button className={styles.watchedBtn} disabled>
                                        ✓ Watched
                                    </button>
                                    <button
                                        className={styles.unwatchedBtn}
                                        onClick={() => onMarkWatched(false)}
                                    >
                                        Mark Unwatched
                                    </button>
                                </>
                            ) : (
                                <button
                                    className={styles.markWatchedBtn}
                                    onClick={() => onMarkWatched(true)}
                                >
                                    Mark as Watched
                                </button>
                            )}
                        </div>
                        {movie.watchDate && (
                            <div className={styles.watchDate}>
                                Watched on {new Date(movie.watchDate).toLocaleDateString()}
                            </div>
                        )}

                        <div className={styles.managementActions}>
                            {!isMoving ? (
                                <>
                                    <button className={styles.moveBtn} onClick={() => setIsMoving(true)}>
                                        <ArrowRightLeft size={16} /> Shift Universe
                                    </button>
                                    <button className={styles.deleteBtn} onClick={onDelete}>
                                        <Trash2 size={16} /> Delete
                                    </button>
                                </>
                            ) : (
                                <div className={styles.moveControls}>
                                    <div className={styles.moveSelects}>
                                        <select
                                            value={targetFranchiseId}
                                            onChange={(e) => {
                                                setTargetFranchiseId(e.target.value);
                                                // Reset collection when franchise changes
                                                const f = franchises.find(fr => fr.id === e.target.value);
                                                if (f && f.collections.length > 0) {
                                                    setTargetCollectionId(f.collections[0].id);
                                                }
                                            }}
                                            className={styles.select}
                                        >
                                            {franchises.map(f => (
                                                <option key={f.id} value={f.id}>{f.name}</option>
                                            ))}
                                        </select>

                                        <select
                                            value={targetCollectionId}
                                            onChange={(e) => setTargetCollectionId(e.target.value)}
                                            className={styles.select}
                                        >
                                            {franchises
                                                .find(f => f.id === targetFranchiseId)
                                                ?.collections.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                    <div className={styles.moveButtons}>
                                        <button
                                            className={styles.confirmMoveBtn}
                                            onClick={() => onMove(targetFranchiseId, targetCollectionId)}
                                        >
                                            Confirm Move
                                        </button>
                                        <button
                                            className={styles.cancelMoveBtn}
                                            onClick={() => setIsMoving(false)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
