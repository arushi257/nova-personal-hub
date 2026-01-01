'use client';

import { useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import styles from './page.module.css';
import FranchiseShelf from '@/components/ember/FranchiseShelf';
import MovieModal from '@/components/ember/MovieModal';

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
    movies: Movie[];
}

interface Franchise {
    id: string;
    name: string;
    type: 'movie-franchise' | 'tv-show';
    collections: Collection[];
    icon: string;
}

const INITIAL_DATA: Franchise[] = [
    {
        id: '1',
        name: 'Marvel Cinematic Universe',
        type: 'movie-franchise',
        icon: '🦸',
        collections: [
            {
                id: 'c1',
                name: 'Phase 1',
                movies: [
                    {
                        id: 'm1',
                        title: 'Iron Man',
                        type: 'movie',
                        watched: true,
                        rating: 5,
                        runtime: 126,
                        releaseYear: 2008,
                        genre: ['Action', 'Sci-Fi'],
                        director: 'Jon Favreau',
                        poster: 'https://m.media-amazon.com/images/M/MV5BMTczNTI2ODUwOF5BMl5BanBnXkFtZTcwMTU0NTIzMw@@._V1_SX300.jpg'
                    },
                    {
                        id: 'm2',
                        title: 'The Incredible Hulk',
                        type: 'movie',
                        watched: false,
                        runtime: 112,
                        releaseYear: 2008,
                        genre: ['Action', 'Sci-Fi'],
                        director: 'Louis Leterrier',
                    },
                ]
            }
        ]
    },
    {
        id: '2',
        name: 'Breaking Bad',
        type: 'tv-show',
        icon: '🧪',
        collections: [
            {
                id: 'c2',
                name: 'Season 1',
                movies: [
                    {
                        id: 'e1',
                        title: 'Pilot',
                        type: 'episode',
                        watched: true,
                        rating: 5,
                        runtime: 58,
                        releaseYear: 2008,
                    }
                ]
            }
        ]
    }
];

export default function VisualPage() {
    const [franchises, setFranchises] = useState<Franchise[]>(INITIAL_DATA);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMovie, setSelectedMovie] = useState<{ movie: Movie; franchiseId: string; collectionId: string } | null>(null);
    const [showAddFranchise, setShowAddFranchise] = useState(false);
    const [showAddCollection, setShowAddCollection] = useState<string | null>(null); // franchiseId
    const [showAddMovie, setShowAddMovie] = useState<{ franchiseId: string; collectionId: string } | null>(null);
    const [formData, setFormData] = useState<{ name: string; type: 'movie-franchise' | 'tv-show'; icon: string }>({
        name: '',
        type: 'movie-franchise',
        icon: '🎬'
    });

    // Add Franchise
    const addFranchise = () => {
        if (formData.name.trim()) {
            const newFranchise: Franchise = {
                id: Date.now().toString(),
                name: formData.name,
                type: formData.type,
                icon: formData.icon || '🎬',
                collections: [],
            };
            setFranchises([...franchises, newFranchise]);
            setFormData({ name: '', type: 'movie-franchise', icon: '🎬' });
            setShowAddFranchise(false);
        }
    };

    // Add Collection
    const addCollection = (franchiseId: string) => {
        if (formData.name.trim()) {
            setFranchises(franchises.map(f =>
                f.id === franchiseId
                    ? { ...f, collections: [...f.collections, { id: Date.now().toString(), name: formData.name, movies: [] }] }
                    : f
            ));
            setFormData({ name: '', type: 'movie-franchise', icon: '🎬' });
            setShowAddCollection(null);
        }
    };

    const [movieSearchQuery, setMovieSearchQuery] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [previewMovie, setPreviewMovie] = useState<Partial<Movie> | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState('');

    // Search Movie from OMDb
    const searchMovie = async () => {
        const key = localStorage.getItem('omdb_api_key') || apiKey;
        if (!key || !movieSearchQuery.trim()) return;

        setIsSearching(true);
        setSearchError('');
        try {
            const res = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(movieSearchQuery)}&apikey=${key}`);
            const data = await res.json();

            if (data.Response === 'True') {
                const runtime = parseInt(data.Runtime) || 0;
                const releaseYear = parseInt(data.Year) || 0;

                setPreviewMovie({
                    title: data.Title,
                    poster: data.Poster,
                    runtime,
                    releaseYear,
                    director: data.Director,
                    genre: data.Genre ? data.Genre.split(', ') : [],
                    plot: data.Plot,
                    imdbID: data.imdbID,
                    type: data.Type === 'series' ? 'episode' : 'movie'
                });
                // Auto-save key if it worked
                if (apiKey) localStorage.setItem('omdb_api_key', apiKey);
            } else {
                setSearchError(data.Error || 'Movie not found');
                setPreviewMovie(null);
            }
        } catch (err) {
            setSearchError('Failed to fetch data');
            console.error(err);
        } finally {
            setIsSearching(false);
        }
    };

    // Add Movie
    const addMovie = (franchiseId: string, collectionId: string) => {
        const movieToAdd = previewMovie ? {
            id: Date.now().toString(),
            title: previewMovie.title!,
            type: previewMovie.type as 'movie' | 'episode' || 'movie',
            watched: false,
            poster: previewMovie.poster,
            runtime: previewMovie.runtime,
            releaseYear: previewMovie.releaseYear,
            director: previewMovie.director,
            genre: previewMovie.genre,
            plot: previewMovie.plot,
            imdbID: previewMovie.imdbID
        } : {
            id: Date.now().toString(),
            title: formData.name,
            type: 'movie' as const,
            watched: false,
        };

        if (movieToAdd.title) {
            setFranchises(franchises.map(f =>
                f.id === franchiseId
                    ? {
                        ...f,
                        collections: f.collections.map(c =>
                            c.id === collectionId
                                ? { ...c, movies: [...c.movies, movieToAdd as Movie] }
                                : c
                        )
                    }
                    : f
            ));
            setFormData({ name: '', type: 'movie-franchise', icon: '🎬' });
            setShowAddMovie(null);
            setPreviewMovie(null);
            setMovieSearchQuery('');
        }
    };

    const handleMarkWatched = (franchiseId: string, collectionId: string, movieId: string, watched: boolean) => {
        setFranchises(franchises.map(f =>
            f.id === franchiseId ? {
                ...f,
                collections: f.collections.map(c =>
                    c.id === collectionId ? {
                        ...c,
                        movies: c.movies.map(m =>
                            m.id === movieId ? { ...m, watched, watchDate: watched ? new Date().toISOString() : undefined } : m
                        )
                    } : c
                )
            } : f
        ));
    };

    const handleRateMovie = (franchiseId: string, collectionId: string, movieId: string, rating: number) => {
        setFranchises(franchises.map(f =>
            f.id === franchiseId ? {
                ...f,
                collections: f.collections.map(c =>
                    c.id === collectionId ? {
                        ...c,
                        movies: c.movies.map(m =>
                            m.id === movieId ? { ...m, rating } : m
                        )
                    } : c
                )
            } : f
        ));
    };

    const deleteMovie = (franchiseId: string, collectionId: string, movieId: string) => {
        if (window.confirm('Are you sure you want to delete this movie?')) {
            setFranchises(franchises.map(f =>
                f.id === franchiseId ? {
                    ...f,
                    collections: f.collections.map(c =>
                        c.id === collectionId ? {
                            ...c,
                            movies: c.movies.filter(m => m.id !== movieId)
                        } : c
                    )
                } : f
            ));
            setSelectedMovie(null);
        }
    };

    const moveMovie = (movieId: string, fromFranchiseId: string, fromCollectionId: string, toFranchiseId: string, toCollectionId: string) => {
        const sourceFranchise = franchises.find(f => f.id === fromFranchiseId);
        const sourceCollection = sourceFranchise?.collections.find(c => c.id === fromCollectionId);
        const movieToMove = sourceCollection?.movies.find(m => m.id === movieId);

        if (movieToMove) {
            setFranchises(franchises.map(f => {
                // Remove from source
                if (f.id === fromFranchiseId) {
                    return {
                        ...f,
                        collections: f.collections.map(c =>
                            c.id === fromCollectionId ? {
                                ...c,
                                movies: c.movies.filter(m => m.id !== movieId)
                            } : c
                        )
                    };
                }
                return f;
            }).map(f => {
                // Add to destination (map again to ensure we don't return stale state from removal step if IDs are same? No, IDs diff)
                // Actually need to handle case where fromFranchise == toFranchise correctly.
                // The above structure is flawed for same-franchise move if done in two passes without updating state reference.
                // Better to simple structure:
                return f;
            }));

            // Let's do it in one pass or structured better
            setFranchises(prev => {
                const newFranchises = [...prev];
                // 1. Find and Remove
                let movie: Movie | undefined;

                const sFIndex = newFranchises.findIndex(f => f.id === fromFranchiseId);
                const sCIndex = newFranchises[sFIndex].collections.findIndex(c => c.id === fromCollectionId);
                const mIndex = newFranchises[sFIndex].collections[sCIndex].movies.findIndex(m => m.id === movieId);

                if (mIndex > -1) {
                    movie = newFranchises[sFIndex].collections[sCIndex].movies[mIndex];
                    newFranchises[sFIndex].collections[sCIndex].movies.splice(mIndex, 1);
                }

                // 2. Add to Dest
                if (movie) {
                    const tFIndex = newFranchises.findIndex(f => f.id === toFranchiseId);
                    const tCIndex = newFranchises[tFIndex].collections.findIndex(c => c.id === toCollectionId);
                    newFranchises[tFIndex].collections[tCIndex].movies.push(movie);
                }

                return newFranchises; // Mutation is okay on deep clone or if we are careful, but safer to map. 
                // Since this is becoming complex logic, let's stick to functional update if possible, but deep splice is easier for moves.
                // We'll return a deep copy to respect React immutability.
            });

            // State update is async, so we'll just close modal
            setSelectedMovie(null);
        }
    };

    // Improved move handler to be pure function
    const handleMoveMovie = (movieId: string, targetFranchiseId: string, targetCollectionId: string) => {
        if (!selectedMovie) return;

        const { franchiseId: fromFId, collectionId: fromCId } = selectedMovie;

        setFranchises((currentFranchises) => {
            const nextFranchises = JSON.parse(JSON.stringify(currentFranchises));

            const sFIndex = nextFranchises.findIndex((f: Franchise) => f.id === fromFId);
            if (sFIndex === -1) return currentFranchises;
            const sCIndex = nextFranchises[sFIndex].collections.findIndex((c: Collection) => c.id === fromCId);
            if (sCIndex === -1) return currentFranchises;

            const mIndex = nextFranchises[sFIndex].collections[sCIndex].movies.findIndex((m: Movie) => m.id === movieId);
            if (mIndex === -1) return currentFranchises;

            const tFIndex = nextFranchises.findIndex((f: Franchise) => f.id === targetFranchiseId);
            if (tFIndex === -1) return currentFranchises;
            const tCIndex = nextFranchises[tFIndex].collections.findIndex((c: Collection) => c.id === targetCollectionId);
            if (tCIndex === -1) return currentFranchises;

            const [movedMovie] = nextFranchises[sFIndex].collections[sCIndex].movies.splice(mIndex, 1);
            if (!movedMovie) return currentFranchises;

            nextFranchises[tFIndex].collections[tCIndex].movies.push(movedMovie);
            return nextFranchises;
        });
        setSelectedMovie(null);
    };

    const handleReorder = (franchiseId: string, collectionId: string, fromIndex: number, toIndex: number) => {
        setFranchises(currentFranchises => {
            const nextFranchises = JSON.parse(JSON.stringify(currentFranchises));
            const franchise = nextFranchises.find((f: Franchise) => f.id === franchiseId);
            const collection = franchise.collections.find((c: Collection) => c.id === collectionId);

            // Reorder logic
            const [movedMovie] = collection.movies.splice(fromIndex, 1);
            collection.movies.splice(toIndex, 0, movedMovie);

            return nextFranchises;
        });
    };

    const filteredFranchises = searchQuery
        ? franchises.filter(f =>
            f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            f.collections.some(c =>
                c.movies.some(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()))
            )
        )
        : franchises;

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.title}>🎬 My Library</h1>
                <div className={styles.controls}>
                    <div className={styles.searchBar}>
                        <Search size={18} className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Search movies, shows, franchises..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                    <button className={styles.addButton} onClick={() => setShowAddFranchise(true)}>
                        <Plus size={20} />
                        Add Franchise
                    </button>
                </div>
            </div>

            {/* Franchise Shelves */}
            <div className={styles.shelves}>
                {filteredFranchises.map(franchise => (
                    <FranchiseShelf
                        key={franchise.id}
                        franchise={franchise}
                        onMovieClick={(movie, collectionId) => setSelectedMovie({ movie, franchiseId: franchise.id, collectionId })}
                        onAddCollection={() => setShowAddCollection(franchise.id)}
                        onAddMovie={(collectionId) => setShowAddMovie({ franchiseId: franchise.id, collectionId })}
                        onReorder={(collectionId, from, to) => handleReorder(franchise.id, collectionId, from, to)}
                    />
                ))}
            </div>

            {/* Movie Modal */}
            {selectedMovie && (
                <MovieModal
                    movie={selectedMovie.movie}
                    onClose={() => setSelectedMovie(null)}
                    onMarkWatched={(watched) => {
                        handleMarkWatched(selectedMovie.franchiseId, selectedMovie.collectionId, selectedMovie.movie.id, watched);
                        if (selectedMovie) {
                            setSelectedMovie({
                                ...selectedMovie,
                                movie: { ...selectedMovie.movie, watched }
                            });
                        }
                    }}
                    onRate={(rating) => {
                        handleRateMovie(selectedMovie.franchiseId, selectedMovie.collectionId, selectedMovie.movie.id, rating);
                        if (selectedMovie) {
                            setSelectedMovie({
                                ...selectedMovie,
                                movie: { ...selectedMovie.movie, rating }
                            });
                        }
                    }}
                    onDelete={() => deleteMovie(selectedMovie.franchiseId, selectedMovie.collectionId, selectedMovie.movie.id)}
                    onMove={(targetFId, targetCId) => handleMoveMovie(selectedMovie.movie.id, targetFId, targetCId)}
                    franchises={franchises}
                    currentFranchiseId={selectedMovie.franchiseId}
                    currentCollectionId={selectedMovie.collectionId}
                />
            )}

            {/* Add Franchise Modal */}
            {showAddFranchise && (
                <div className={styles.modalOverlay} onClick={() => setShowAddFranchise(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h2>Add New Franchise</h2>
                        <input
                            type="text"
                            placeholder="Franchise name (e.g., Star Wars)"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className={styles.input}
                        />
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'movie-franchise' | 'tv-show' })}
                            className={styles.input}
                        >
                            <option value="movie-franchise">Movie Franchise</option>
                            <option value="tv-show">TV Show</option>
                        </select>
                        <input
                            type="text"
                            placeholder="Icon (emoji)"
                            value={formData.icon}
                            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                            className={styles.input}
                        />
                        <div className={styles.modalButtons}>
                            <button onClick={addFranchise} className={styles.submitBtn}>Add</button>
                            <button onClick={() => setShowAddFranchise(false)} className={styles.cancelBtn}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Collection Modal */}
            {showAddCollection && (
                <div className={styles.modalOverlay} onClick={() => setShowAddCollection(null)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h2>Add New Collection</h2>
                        <input
                            type="text"
                            placeholder="Collection name (e.g., Phase 1, Season 1)"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className={styles.input}
                        />
                        <div className={styles.modalButtons}>
                            <button onClick={() => addCollection(showAddCollection)} className={styles.submitBtn}>Add</button>
                            <button onClick={() => setShowAddCollection(null)} className={styles.cancelBtn}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Movie Modal */}
            {showAddMovie && (
                <div className={styles.modalOverlay} onClick={() => {
                    setShowAddMovie(null);
                    setMovieSearchQuery('');
                    setPreviewMovie(null);
                }}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h2>Add New Search</h2>

                        {!localStorage.getItem('omdb_api_key') && !apiKey ? (
                            <div className={styles.apiKeySection}>
                                <p className={styles.hint}>Enter your OMDb API Key to fetch movie data automatically.</p>
                                <input
                                    type="text"
                                    placeholder="OMDb API Key"
                                    onChange={(e) => setApiKey(e.target.value)}
                                    className={styles.input}
                                />
                                <small style={{ display: 'block', marginTop: '0.5rem', color: '#888' }}>
                                    Get a free key at <a href="https://www.omdbapi.com/apikey.aspx" target="_blank" rel="noreferrer" style={{ color: '#60A5FA' }}>omdbapi.com</a>
                                </small>
                            </div>
                        ) : (
                            <div className={styles.searchSection}>
                                <div className={styles.searchRow}>
                                    <input
                                        type="text"
                                        placeholder="Movie/Show Title (e.g. Inception)"
                                        value={movieSearchQuery}
                                        onChange={(e) => setMovieSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && searchMovie()}
                                        className={styles.input}
                                        autoFocus
                                    />
                                    <button
                                        onClick={searchMovie}
                                        className={styles.searchBtn}
                                        disabled={isSearching}
                                    >
                                        {isSearching ? '...' : <Search size={20} />}
                                    </button>
                                </div>
                                {searchError && <p className={styles.error}>{searchError}</p>}
                            </div>
                        )}

                        {previewMovie && (
                            <div className={styles.previewCard}>
                                {previewMovie.poster && previewMovie.poster !== 'N/A' && (
                                    <img src={previewMovie.poster} alt="Preview" className={styles.previewPoster} />
                                )}
                                <div className={styles.previewInfo}>
                                    <h3>{previewMovie.title}</h3>
                                    <p>{previewMovie.releaseYear} • {previewMovie.runtime}m</p>
                                    <p className={styles.previewPlot}>{previewMovie.plot}</p>
                                </div>
                            </div>
                        )}

                        <div className={styles.modalButtons}>
                            {previewMovie || (localStorage.getItem('omdb_api_key') || apiKey) ? (
                                <button
                                    onClick={() => addMovie(showAddMovie.franchiseId, showAddMovie.collectionId)}
                                    className={styles.submitBtn}
                                    disabled={!previewMovie && !formData.name}
                                >
                                    {previewMovie ? 'Add Movie' : 'Add Manually'}
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        if (apiKey) {
                                            localStorage.setItem('omdb_api_key', apiKey);
                                            // Trigger re-render or continue
                                            setApiKey(apiKey);
                                        }
                                    }}
                                    className={styles.submitBtn}
                                >
                                    Save Key
                                </button>
                            )}
                            <button onClick={() => {
                                setShowAddMovie(null);
                                setMovieSearchQuery('');
                                setPreviewMovie(null);
                            }} className={styles.cancelBtn}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
