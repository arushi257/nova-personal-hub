'use client';

import styles from './MovieCard.module.css';

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
    poster?: string;
}

interface Props {
    movie: Movie;
    onClick: () => void;
}

export default function MovieCard({ movie, onClick }: Props) {
    const formatRuntime = (minutes?: number) => {
        if (!minutes) return '';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    const renderStars = (rating?: number) => {
        if (!rating) return null;
        return '★'.repeat(rating) + '☆'.repeat(5 - rating);
    };

    return (
        <div className={styles.card} onClick={onClick}>
            <div className={styles.poster}>
                {movie.poster && movie.poster !== 'N/A' ? (
                    <img src={movie.poster} alt={movie.title} className={styles.posterImage} />
                ) : (
                    <div className={styles.placeholderPoster}>
                        <span className={styles.playIcon}>▶</span>
                    </div>
                )}
                {movie.watched && (
                    <div className={styles.watchedBadge}>WATCHED</div>
                )}
            </div>

            <div className={styles.info}>
                <h4 className={styles.title}>{movie.title}</h4>
                {movie.rating && (
                    <div className={styles.rating}>{renderStars(movie.rating)}</div>
                )}
                <div className={styles.meta}>
                    {movie.releaseYear && <span>{movie.releaseYear}</span>}
                    {movie.runtime && <span>{formatRuntime(movie.runtime)}</span>}
                </div>
            </div>
        </div>
    );
}
