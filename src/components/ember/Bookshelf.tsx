'use client';

import { useState, useRef } from 'react';
import { Plus, GripVertical, Trash2, Tag } from 'lucide-react';
import styles from './Bookshelf.module.css';
import BookSpine from './BookSpine';

interface Book {
    id: string;
    title: string;
    author?: string;
    coverUrl?: string;
    status: 'unread' | 'read';
    rating?: 1 | 2 | 3 | 4 | 5;
    quotes: string[];
    notes: string;
    universeTag?: string;
}

interface Series {
    id: string;
    name: string;
    books: Book[];
}

interface Props {
    series: Series;
    isDragging?: boolean;
    activeTagFilter?: string | null;
    existingTags?: string[];
    onBookClick: (book: Book) => void;
    onAddBook: () => void;
    onReorderBooks: (fromIndex: number, toIndex: number) => void;
    onShelfDragStart: () => void;
    onShelfDragEnd: () => void;
    onShelfDrop: () => void;
    onDeleteShelf: () => void;
    onTagShelf: (tag: string) => void;
}

export default function BookShelf({ 
    series, 
    isDragging,
    activeTagFilter,
    existingTags = [],
    onBookClick, 
    onAddBook, 
    onReorderBooks,
    onShelfDragStart,
    onShelfDragEnd,
    onShelfDrop,
    onDeleteShelf,
    onTagShelf
}: Props) {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [isShelfDragOver, setIsShelfDragOver] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showTagInput, setShowTagInput] = useState(false);
    const [tagValue, setTagValue] = useState('');
    const dragCounter = useRef(0);
    const tagInputRef = useRef<HTMLInputElement>(null);

    const handleDeleteClick = () => {
        if (showDeleteConfirm) {
            onDeleteShelf();
        } else {
            setShowDeleteConfirm(true);
            // Auto-reset after 3 seconds
            setTimeout(() => setShowDeleteConfirm(false), 3000);
        }
    };

    const handleTagClick = () => {
        setShowTagInput(!showTagInput);
        if (!showTagInput) {
            setTimeout(() => tagInputRef.current?.focus(), 50);
        }
    };

    const handleTagSubmit = () => {
        if (tagValue.trim()) {
            onTagShelf(tagValue.trim());
            setTagValue('');
            setShowTagInput(false);
        }
    };

    const handleTagKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleTagSubmit();
        } else if (e.key === 'Escape') {
            setShowTagInput(false);
            setTagValue('');
        }
    };

    // Get the common tag if all books have the same tag
    const getShelfTag = () => {
        if (series.books.length === 0) return null;
        const firstTag = series.books[0]?.universeTag;
        if (!firstTag) return null;
        const allSame = series.books.every(b => b.universeTag === firstTag);
        return allSame ? firstTag : null;
    };

    const shelfTag = getShelfTag();

    // Book drag handlers
    const handleDragStart = (e: React.DragEvent, index: number) => {
        e.stopPropagation();
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', `book:${index}`);
        
        setTimeout(() => {
            (e.target as HTMLElement).style.opacity = '0.5';
        }, 0);
    };

    const handleDragEnd = (e: React.DragEvent) => {
        (e.target as HTMLElement).style.opacity = '1';
        setDraggedIndex(null);
        setDragOverIndex(null);
        dragCounter.current = 0;
    };

    const handleDragEnter = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current++;
        if (index !== draggedIndex) {
            setDragOverIndex(index);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current--;
        if (dragCounter.current === 0) {
            setDragOverIndex(null);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, toIndex: number) => {
        e.preventDefault();
        e.stopPropagation();
        const data = e.dataTransfer.getData('text/plain');
        
        if (data.startsWith('book:')) {
            const fromIndex = parseInt(data.split(':')[1]);
            if (fromIndex !== toIndex) {
                onReorderBooks(fromIndex, toIndex);
            }
        }
        
        setDraggedIndex(null);
        setDragOverIndex(null);
        dragCounter.current = 0;
    };

    // Shelf drag handlers
    const handleShelfDragStart = (e: React.DragEvent) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', `shelf:${series.id}`);
        onShelfDragStart();
    };

    const handleShelfDragEnd = () => {
        setIsShelfDragOver(false);
        onShelfDragEnd();
    };

    const handleShelfDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        const data = e.dataTransfer.types.includes('text/plain');
        if (data) {
            setIsShelfDragOver(true);
        }
    };

    const handleShelfDragLeave = () => {
        setIsShelfDragOver(false);
    };

    const handleShelfDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('text/plain');
        if (data.startsWith('shelf:')) {
            onShelfDrop();
        }
        setIsShelfDragOver(false);
    };

    return (
        <div 
            className={`${styles.shelf} ${isDragging ? styles.dragging : ''} ${isShelfDragOver ? styles.dragOver : ''}`}
            onDragOver={handleShelfDragOver}
            onDragLeave={handleShelfDragLeave}
            onDrop={handleShelfDrop}
        >
            {/* Wooden frame - left */}
            <div className={styles.frameLeft} />
            
            {/* Wooden frame - right */}
            <div className={styles.frameRight} />
            
            {/* Shelf back panel */}
            <div className={styles.shelfBack} />
            
            {/* Drag handle */}
            <div 
                className={styles.dragHandle}
                draggable
                onDragStart={handleShelfDragStart}
                onDragEnd={handleShelfDragEnd}
                title="Drag to reorder shelf"
            >
                <GripVertical size={14} />
            </div>

            {/* Action buttons */}
            <div className={styles.shelfActions}>
                <button 
                    className={styles.addBtn}
                    onClick={onAddBook}
                    title="Add book"
                >
                    <Plus size={14} />
                </button>
                <button 
                    className={`${styles.deleteBtn} ${showDeleteConfirm ? styles.deleteConfirm : ''}`}
                    onClick={handleDeleteClick}
                    title={showDeleteConfirm ? "Click again to confirm" : "Delete shelf"}
                >
                    <Trash2 size={14} />
                </button>
                <button 
                    className={styles.tagBtn}
                    onClick={handleTagClick}
                    title={shelfTag ? `Tagged: ${shelfTag}` : "Tag all books on shelf"}
                >
                    <Tag size={14} />
                </button>
            </div>

            {/* Tag input dropdown */}
            {showTagInput && (
                <div className={styles.tagDropdown}>
                    <input
                        ref={tagInputRef}
                        type="text"
                        className={styles.tagInput}
                        placeholder="Enter tag..."
                        value={tagValue}
                        onChange={(e) => setTagValue(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        onBlur={() => setTimeout(() => setShowTagInput(false), 150)}
                    />
                    {existingTags.length > 0 && (
                        <div className={styles.tagSuggestions}>
                            {existingTags.filter(t => t.toLowerCase().includes(tagValue.toLowerCase())).map(tag => (
                                <button
                                    key={tag}
                                    className={styles.tagSuggestion}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        onTagShelf(tag);
                                        setShowTagInput(false);
                                        setTagValue('');
                                    }}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Books container */}
            <div className={styles.booksArea}>
                {series.books.length > 0 ? (
                    <div className={styles.booksRow}>
                        {series.books.map((book, index) => (
                            <div
                                key={book.id}
                                className={`${styles.bookSlot} ${dragOverIndex === index ? styles.bookDragOver : ''}`}
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragEnd={handleDragEnd}
                                onDragEnter={(e) => handleDragEnter(e, index)}
                                onDragLeave={handleDragLeave}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, index)}
                            >
                                <BookSpine
                                    book={book}
                                    onClick={() => onBookClick(book)}
                                    isHighlighted={activeTagFilter ? book.universeTag === activeTagFilter : null}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.emptyShelf}>
                        <button onClick={onAddBook} className={styles.emptyAddBtn}>
                            <Plus size={12} /> Add book
                        </button>
                    </div>
                )}
            </div>

            {/* Shelf plank with series name */}
            <div className={styles.shelfPlank}>
                <span className={styles.seriesName} title={series.name}>{series.name}</span>
            </div>
        </div>
    );
}
