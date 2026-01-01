'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, X, BarChart3, BookOpen } from 'lucide-react';
import styles from './page.module.css';
import BookShelf from '@/components/ember/Bookshelf';
import BookModal from '@/components/ember/BookModal';
import StatsPanel from '@/components/ember/StatsPanel';

// Type definitions
export interface Book {
    id: string;
    title: string;
    author?: string;
    genre?: string;
    coverUrl?: string;
    status: 'unread' | 'read';
    rating?: 1 | 2 | 3 | 4 | 5;
    quotes: string[];
    notes: string;
    fileUrl?: string;
    fileName?: string;
    dateFinished?: string;
    universeTag?: string;
    totalPages?: number;
}

export interface Series {
    id: string;
    name: string;
    books: Book[];
    order?: number;
}

export interface Universe {
    id: string;
    name: string;
    icon?: string;
    series: Series[];
}

const STORAGE_KEY = 'ember-bookshelf-data';
const SHELF_ORDER_KEY = 'ember-shelf-order';

const DEFAULT_DATA: Universe[] = [
    {
        id: '1',
        name: 'Fantasy',
        series: [
            {
                id: 's1',
                name: 'The Lord of the Rings',
                books: [
                    { id: 'b1', title: 'The Fellowship of the Ring', author: 'J.R.R. Tolkien', status: 'unread', quotes: [], notes: '' },
                    { id: 'b2', title: 'The Two Towers', author: 'J.R.R. Tolkien', status: 'unread', quotes: [], notes: '' },
                    { id: 'b3', title: 'The Return of the King', author: 'J.R.R. Tolkien', status: 'unread', quotes: [], notes: '' },
                ]
            }
        ]
    }
];

interface BookMetadata {
    author?: string;
    coverUrl?: string;
    genre?: string;
}

async function fetchBookMetadata(title: string, author?: string): Promise<BookMetadata> {
    try {
        const query = author ? `${title} ${author}` : title;
        const response = await fetch(
            `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=1`
        );
        const data = await response.json();

        const doc = data.docs?.[0];
        if (!doc) return {};

        const coverUrl = doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : undefined;
        const detectedAuthor = doc.author_name?.[0];
        const detectedGenre = doc.subject?.[0] || doc.subject_facet?.[0];

        return {
            author: detectedAuthor,
            coverUrl,
            genre: detectedGenre
        };
    } catch {
        return {};
    }
}

export default function BooksPage() {
    const [universes, setUniverses] = useState<Universe[]>([]);
    const [shelfOrder, setShelfOrder] = useState<string[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBook, setSelectedBook] = useState<{ book: Book; universeId: string; seriesId: string } | null>(null);
    const [showAddForm, setShowAddForm] = useState<'universe' | 'series' | 'book' | null>(null);
    const [formData, setFormData] = useState({ universe: '', series: '', title: '', author: '', genre: '', totalPages: '' });
    const [showStats, setShowStats] = useState(false);
    const [isAddingBook, setIsAddingBook] = useState(false);
    const [draggedShelfId, setDraggedShelfId] = useState<string | null>(null);
    const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        const savedOrder = localStorage.getItem(SHELF_ORDER_KEY);
        
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const migrated = parsed.map((u: Universe) => ({
                    ...u,
                    series: u.series.map((s: Series) => ({
                        ...s,
                        books: s.books.map((b: Book & { read?: boolean }) => ({
                            ...b,
                            status: b.status || (b.read ? 'read' : 'unread'),
                        }))
                    }))
                }));
                setUniverses(migrated);
                
                if (savedOrder) {
                    setShelfOrder(JSON.parse(savedOrder));
                }
            } catch {
                setUniverses(DEFAULT_DATA);
            }
        } else {
            setUniverses(DEFAULT_DATA);
        }
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(universes));
        }
    }, [universes, isLoaded]);

    useEffect(() => {
        if (isLoaded && shelfOrder.length > 0) {
            localStorage.setItem(SHELF_ORDER_KEY, JSON.stringify(shelfOrder));
        }
    }, [shelfOrder, isLoaded]);

    // Flatten all series from all universes
    const getAllSeries = useCallback(() => {
        const allSeries = universes.flatMap(u => 
            u.series.map(s => ({
                ...s,
                universeId: u.id,
                universeName: u.name
            }))
        );
        
        // Sort by shelf order if available
        if (shelfOrder.length > 0) {
            return allSeries.sort((a, b) => {
                const aIndex = shelfOrder.indexOf(a.id);
                const bIndex = shelfOrder.indexOf(b.id);
                if (aIndex === -1 && bIndex === -1) return 0;
                if (aIndex === -1) return 1;
                if (bIndex === -1) return -1;
                return aIndex - bIndex;
            });
        }
        return allSeries;
    }, [universes, shelfOrder]);

    const handleAddUniverse = () => {
        if (formData.universe.trim()) {
            const newUniverse: Universe = {
                id: Date.now().toString(),
                name: formData.universe.trim(),
                series: []
            };
            setUniverses([...universes, newUniverse]);
            setFormData({ ...formData, universe: '' });
            setShowAddForm(null);
        }
    };

    const handleAddSeries = () => {
        if (formData.series.trim()) {
            const targetUniverseName = formData.universe.trim() || '__standalone__';
            
            let universeExists = universes.find(u => u.name === targetUniverseName);
            if (!universeExists) {
                const newUniverse = {
                    id: targetUniverseName === '__standalone__' ? 'standalone' : Date.now().toString(),
                    name: targetUniverseName,
                    series: []
                };
                setUniverses(prev => [...prev, newUniverse]);
            }
            
            const newSeriesId = Date.now().toString();
            setUniverses(prev => prev.map(u => {
                if (u.name === targetUniverseName) {
                    return {
                        ...u,
                        series: [...u.series, { id: newSeriesId, name: formData.series.trim(), books: [] }]
                    };
                }
                return u;
            }));
            
            // Add new shelf to the end of order
            setShelfOrder(prev => [...prev, newSeriesId]);
            
            setFormData({ ...formData, universe: '', series: '' });
            setShowAddForm(null);
        }
    };

    const handleAddBook = async () => {
        if (formData.title.trim() && !isAddingBook) {
            setIsAddingBook(true);
            
            const targetUniverseName = formData.universe.trim() || '__standalone__';
            const targetSeriesName = formData.series.trim() || formData.title.trim();

            const metadata = await fetchBookMetadata(formData.title.trim(), formData.author.trim());
            const coverUrl = metadata.coverUrl;

            const newBook: Book = {
                id: Date.now().toString(),
                title: formData.title.trim(),
                author: formData.author.trim() || metadata.author || undefined,
                genre: formData.genre.trim() || metadata.genre || undefined,
                coverUrl,
                status: 'unread',
                quotes: [],
                notes: '',
                totalPages: formData.totalPages ? parseInt(formData.totalPages) : undefined,
            };

            let newSeriesId: string | null = null;

            setUniverses(prev => {
                let updated = [...prev];

                let universeExists = updated.find(u => u.name === targetUniverseName);
                if (!universeExists) {
                    updated.push({
                        id: targetUniverseName === '__standalone__' ? 'standalone' : Date.now().toString(),
                        name: targetUniverseName,
                        series: []
                    });
                }

                return updated.map(u => {
                    if (u.name === targetUniverseName) {
                        const seriesExists = u.series.find(s => s.name === targetSeriesName);

                        if (!seriesExists) {
                            newSeriesId = Date.now().toString() + '_s';
                            return {
                                ...u,
                                series: [...u.series, {
                                    id: newSeriesId,
                                    name: targetSeriesName,
                                    books: [newBook]
                                }]
                            };
                        } else {
                            return {
                                ...u,
                                series: u.series.map(s => {
                                    if (s.name === targetSeriesName) {
                                        return { ...s, books: [...s.books, newBook] };
                                    }
                                    return s;
                                })
                            };
                        }
                    }
                    return u;
                });
            });

            // Add new series to order if created
            if (newSeriesId) {
                setShelfOrder(prev => [...prev, newSeriesId!]);
            }

            setFormData({ universe: '', series: '', title: '', author: '', genre: '', totalPages: '' });
            setShowAddForm(null);
            setIsAddingBook(false);
        }
    };

    const handleBookClick = (book: Book, universeId: string, seriesId: string) => {
        setSelectedBook({ book, universeId, seriesId });
    };

    const handleUpdateBook = useCallback((updatedBook: Book) => {
        setUniverses(prev => prev.map(u => {
            if (u.id === selectedBook?.universeId) {
                return {
                    ...u,
                    series: u.series.map(s => {
                        if (s.id === selectedBook?.seriesId) {
                            return {
                                ...s,
                                books: s.books.map(b => b.id === updatedBook.id ? updatedBook : b)
                            };
                        }
                        return s;
                    })
                };
            }
            return u;
        }));
        setSelectedBook(prev => prev ? { ...prev, book: updatedBook } : null);
    }, [selectedBook?.universeId, selectedBook?.seriesId]);

    const handleStatusChange = (newStatus: 'unread' | 'read') => {
        if (!selectedBook) return;

        const updates: Partial<Book> = { status: newStatus };
        
        if (newStatus === 'read' && !selectedBook.book.dateFinished) {
            updates.dateFinished = new Date().toISOString().split('T')[0];
        }
        if (newStatus === 'unread') {
            updates.dateFinished = undefined;
        }

        handleUpdateBook({ ...selectedBook.book, ...updates });
    };

    const handleDeleteBook = (bookId: string) => {
        setUniverses(prevUniverses => {
            const updated = prevUniverses.map(universe => ({
                ...universe,
                series: universe.series.map(series => ({
                    ...series,
                    books: series.books.filter(b => b.id !== bookId)
                })).filter(s => s.books.length > 0)
            })).filter(u => u.series.length > 0 || u.name === '__standalone__');
            
            return updated;
        });
        setSelectedBook(null);
    };

    const handleMoveBook = (targetSeriesId: string) => {
        if (!selectedBook || targetSeriesId === selectedBook.seriesId) return;

        setUniverses(prev => {
            const sourceSeries = prev
                .flatMap(u => u.series)
                .find(s => s.id === selectedBook.seriesId);
            const bookToMove = sourceSeries?.books.find(b => b.id === selectedBook.book.id);

            if (!bookToMove) return prev;
            const targetExists = prev.some(u => u.series.some(s => s.id === targetSeriesId));
            if (!targetExists) return prev;

            return prev.map(u => ({
                ...u,
                series: u.series.map(s => {
                    if (s.id === selectedBook.seriesId) {
                        return {
                            ...s,
                            books: s.books.filter(b => b.id !== bookToMove.id)
                        };
                    }
                    if (s.id === targetSeriesId) {
                        return {
                            ...s,
                            books: [...s.books, bookToMove]
                        };
                    }
                    return s;
                })
            }));
        });

        setSelectedBook(prev => prev ? { ...prev, seriesId: targetSeriesId } : null);
    };

    const handleReorderBooks = (seriesId: string, universeId: string, fromIndex: number, toIndex: number) => {
        setUniverses(prev => prev.map(u => {
            if (u.id === universeId) {
                return {
                    ...u,
                    series: u.series.map(s => {
                        if (s.id === seriesId) {
                            const newBooks = [...s.books];
                            const [movedBook] = newBooks.splice(fromIndex, 1);
                            newBooks.splice(toIndex, 0, movedBook);
                            return { ...s, books: newBooks };
                        }
                        return s;
                    })
                };
            }
            return u;
        }));
    };

    // Shelf reordering
    const handleShelfDragStart = (shelfId: string) => {
        setDraggedShelfId(shelfId);
    };

    const handleShelfDragEnd = () => {
        setDraggedShelfId(null);
    };

    const handleShelfDrop = (targetShelfId: string) => {
        if (!draggedShelfId || draggedShelfId === targetShelfId) return;

        const allSeries = getAllSeries();
        const currentOrder = allSeries.map(s => s.id);
        
        const fromIndex = currentOrder.indexOf(draggedShelfId);
        const toIndex = currentOrder.indexOf(targetShelfId);
        
        if (fromIndex === -1 || toIndex === -1) return;

        const newOrder = [...currentOrder];
        const [moved] = newOrder.splice(fromIndex, 1);
        newOrder.splice(toIndex, 0, moved);
        
        setShelfOrder(newOrder);
        setDraggedShelfId(null);
    };

    // Delete shelf
    const handleDeleteShelf = (seriesId: string, universeId: string) => {
        setUniverses(prev => {
            const updated = prev.map(u => {
                if (u.id === universeId) {
                    return {
                        ...u,
                        series: u.series.filter(s => s.id !== seriesId)
                    };
                }
                return u;
            }).filter(u => u.series.length > 0 || u.name === '__standalone__');
            
            return updated;
        });
        
        // Remove from shelf order
        setShelfOrder(prev => prev.filter(id => id !== seriesId));
    };

    // Tag all books in a shelf
    const handleTagShelf = (seriesId: string, universeId: string, tag: string) => {
        setUniverses(prev => prev.map(u => {
            if (u.id === universeId) {
                return {
                    ...u,
                    series: u.series.map(s => {
                        if (s.id === seriesId) {
                            return {
                                ...s,
                                books: s.books.map(b => ({ ...b, universeTag: tag }))
                            };
                        }
                        return s;
                    })
                };
            }
            return u;
        }));
    };

    // Filter series based on search
    const getFilteredSeries = () => {
        const allSeries = getAllSeries();
        
        if (!searchQuery) return allSeries;
        
        return allSeries.map(s => ({
            ...s,
            books: s.books.filter(b =>
                b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (b.author && b.author.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (b.genre && b.genre.toLowerCase().includes(searchQuery.toLowerCase()))
            )
        })).filter(s => s.books.length > 0);
    };

    const seriesOptions = useMemo(
        () =>
            getAllSeries().map((series) => ({
                id: series.id,
                name: series.name,
                universeName: series.universeName
            })),
        [getAllSeries]
    );

    const filteredSeries = getFilteredSeries();

    const allBooks = universes.flatMap(u => u.series.flatMap(s => s.books));
    const stats = {
        total: allBooks.length,
        read: allBooks.filter(b => b.status === 'read').length,
        unread: allBooks.filter(b => b.status === 'unread').length,
    };

    // Get all unique universe tags
    const allTags = [...new Set(allBooks.map(b => b.universeTag).filter(Boolean))] as string[];

    if (!isLoaded) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingState}>
                    <BookOpen size={48} className={styles.loadingIcon} />
                    <p>Loading your bookshelf...</p>
                </div>
            </div>
        );
    }

    const hasBooks = filteredSeries.some(s => s.books.length > 0);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.searchWrapper}>
                    <div className={styles.searchContainer}>
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Search books..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button className={styles.searchClear} onClick={() => setSearchQuery('')}>
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>

                <div className={styles.controls}>
                    <button 
                        className={`${styles.statsButton} ${showStats ? styles.statsActive : ''}`} 
                        onClick={() => setShowStats(!showStats)}
                        title="View Statistics"
                    >
                        <BarChart3 size={18} />
                        <span className={styles.statsCount}>{stats.read}/{stats.total}</span>
                    </button>
                    <button className={styles.addButton} onClick={() => setShowAddForm('series')}>
                        <Plus size={18} />
                        Shelf
                    </button>
                    <button className={`${styles.addButton} ${styles.primaryButton}`} onClick={() => setShowAddForm('book')}>
                        <Plus size={18} />
                        Book
                    </button>
                </div>
            </div>

            {showStats && (
                <StatsPanel 
                    universes={universes.filter(u => u.name !== '__standalone__')} 
                    allBooks={allBooks} 
                />
            )}

            {/* Tag filters */}
            {allTags.length > 0 && (
                <div className={styles.tagFilters}>
                    <span className={styles.tagFilterLabel}>Filter:</span>
                    {allTags.map(tag => (
                        <button
                            key={tag}
                            className={`${styles.tagFilterBtn} ${activeTagFilter === tag ? styles.activeTag : ''}`}
                            onClick={() => setActiveTagFilter(activeTagFilter === tag ? null : tag)}
                        >
                            {tag}
                        </button>
                    ))}
                    {activeTagFilter && (
                        <button 
                            className={styles.clearFilterBtn}
                            onClick={() => setActiveTagFilter(null)}
                        >
                            Clear
                        </button>
                    )}
                </div>
            )}

            {/* Main Bookshelf */}
            <div className={styles.bookcaseWrapper}>
                {hasBooks || filteredSeries.length > 0 ? (
                    <div className={styles.bookcase}>
                        <div className={styles.bookcaseFrameLeft} />
                        
                        <div className={styles.bookcaseContent}>
                            {filteredSeries.map(series => (
                                <BookShelf
                                    key={series.id}
                                    series={series}
                                    isDragging={draggedShelfId === series.id}
                                    activeTagFilter={activeTagFilter}
                                    onBookClick={(book) => handleBookClick(book, series.universeId, series.id)}
                                    onAddBook={() => {
                                        setFormData({ 
                                            ...formData, 
                                            universe: series.universeName === '__standalone__' ? '' : series.universeName, 
                                            series: series.name 
                                        });
                                        setShowAddForm('book');
                                    }}
                                    onReorderBooks={(fromIndex, toIndex) => 
                                        handleReorderBooks(series.id, series.universeId, fromIndex, toIndex)
                                    }
                                    onShelfDragStart={() => handleShelfDragStart(series.id)}
                                    onShelfDragEnd={handleShelfDragEnd}
                                    onShelfDrop={() => handleShelfDrop(series.id)}
                                    onDeleteShelf={() => handleDeleteShelf(series.id, series.universeId)}
                                    onTagShelf={(tag) => handleTagShelf(series.id, series.universeId, tag)}
                                    existingTags={allTags}
                                />
                            ))}
                        </div>

                        <div className={styles.bookcaseFrameRight} />
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <BookOpen size={48} />
                        <h2>Your bookshelf is empty</h2>
                        <p>Start by adding your first book!</p>
                        <button 
                            className={styles.emptyAddButton}
                            onClick={() => setShowAddForm('book')}
                        >
                            <Plus size={20} />
                            Add Your First Book
                        </button>
                    </div>
                )}
            </div>

            {/* Add Form Modal */}
            {showAddForm && (
                <div className={styles.modalOverlay} onClick={() => setShowAddForm(null)}>
                    <div className={styles.addModal} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.modalClose} onClick={() => setShowAddForm(null)}>
                            <X size={20} />
                        </button>
                        <h2 className={styles.modalTitle}>
                            Add {showAddForm === 'universe' ? 'Universe' : showAddForm === 'series' ? 'Shelf' : 'Book'}
                        </h2>

                        {showAddForm === 'universe' && (
                            <>
                                <input
                                    type="text"
                                    placeholder="Universe name"
                                    value={formData.universe}
                                    onChange={(e) => setFormData({ ...formData, universe: e.target.value })}
                                    className={styles.formInput}
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddUniverse()}
                                />
                                <div className={styles.modalButtons}>
                                    <button onClick={handleAddUniverse} className={styles.submitButton}>Add</button>
                                    <button onClick={() => setShowAddForm(null)} className={styles.cancelButton}>Cancel</button>
                                </div>
                            </>
                        )}

                        {showAddForm === 'series' && (
                            <>
                                <p className={styles.modalHint}>
                                    A shelf holds a collection of books (e.g., a series)
                                </p>
                                <input
                                    type="text"
                                    placeholder="Shelf name (e.g., Harry Potter, Sci-Fi Favorites)"
                                    value={formData.series}
                                    onChange={(e) => setFormData({ ...formData, series: e.target.value })}
                                    className={styles.formInput}
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddSeries()}
                                />
                                <div className={styles.modalButtons}>
                                    <button onClick={handleAddSeries} className={styles.submitButton}>Add Shelf</button>
                                    <button onClick={() => setShowAddForm(null)} className={styles.cancelButton}>Cancel</button>
                                </div>
                            </>
                        )}

                        {showAddForm === 'book' && (
                            <>
                                <input
                                    type="text"
                                    placeholder="Book title *"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className={styles.formInput}
                                    autoFocus
                                />
                                <input
                                    type="text"
                                    placeholder="Author"
                                    value={formData.author}
                                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                    className={styles.formInput}
                                />
                            <input
                                type="text"
                                placeholder="Genre (auto-fills if found)"
                                value={formData.genre}
                                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                                className={styles.formInput}
                            />
                                <input
                                    type="number"
                                    placeholder="Total pages (optional)"
                                    value={formData.totalPages}
                                    onChange={(e) => setFormData({ ...formData, totalPages: e.target.value })}
                                    className={styles.formInput}
                                    min="1"
                                />
                                <select
                                    value={formData.series}
                                    onChange={(e) => setFormData({ ...formData, series: e.target.value })}
                                    className={styles.formInput}
                                >
                                    <option value="">New shelf (uses book title)</option>
                                    {getAllSeries().map(s => (
                                        <option key={s.id} value={s.name}>{s.name}</option>
                                    ))}
                                </select>
                                <div className={styles.modalButtons}>
                                    <button 
                                        onClick={handleAddBook} 
                                        className={styles.submitButton}
                                        disabled={isAddingBook}
                                    >
                                        {isAddingBook ? 'Adding...' : 'Add Book'}
                                    </button>
                                    <button onClick={() => setShowAddForm(null)} className={styles.cancelButton}>Cancel</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {selectedBook && (
                <BookModal
                    book={selectedBook.book}
                    onClose={() => setSelectedBook(null)}
                    onUpdate={handleUpdateBook}
                    onStatusChange={handleStatusChange}
                    onDelete={() => handleDeleteBook(selectedBook.book.id)}
                    seriesOptions={seriesOptions}
                    currentSeriesId={selectedBook.seriesId}
                    onMove={handleMoveBook}
                />
            )}
        </div>
    );
}
