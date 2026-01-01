'use client';

import { useState, useEffect } from 'react';
import { X, Trash2, BookOpen, Check, Clock, Tag } from 'lucide-react';
import { Book } from '@/app/ember/books/page';
import styles from './BookModal.module.css';

interface SeriesOption {
    id: string;
    name: string;
    universeName?: string;
}

interface BookModalProps {
    book: Book;
    onClose: () => void;
    onUpdate: (book: Book) => void;
    onStatusChange: (status: 'unread' | 'read') => void;
    onDelete: () => void;
    seriesOptions: SeriesOption[];
    currentSeriesId: string;
    onMove: (seriesId: string) => void;
}

const emojiRatings = [
    { value: 1, emoji: '😢', label: 'Terrible' },
    { value: 2, emoji: '😕', label: 'Bad' },
    { value: 3, emoji: '😐', label: 'Okay' },
    { value: 4, emoji: '🙂', label: 'Good' },
    { value: 5, emoji: '😄', label: 'Amazing' },
];

export default function BookModal({
    book,
    onClose,
    onUpdate,
    onStatusChange,
    onDelete,
    seriesOptions,
    currentSeriesId,
    onMove
}: BookModalProps) {
    const [rating, setRating] = useState<number | undefined>(book.rating);
    const [quotes, setQuotes] = useState<string[]>(book.quotes);
    const [newQuote, setNewQuote] = useState('');
    const [notes, setNotes] = useState(book.notes);
    const [fileName, setFileName] = useState(book.fileName);
    const [isDeleting, setIsDeleting] = useState(false);
    const [universeTag, setUniverseTag] = useState(book.universeTag || '');
    const [isEditingTag, setIsEditingTag] = useState(false);
    const [genre, setGenre] = useState(book.genre || '');
    const [targetSeriesId, setTargetSeriesId] = useState(currentSeriesId);

    const handleRatingChange = (value: number) => {
        setRating(value as 1 | 2 | 3 | 4 | 5);
        onUpdate({ ...book, rating: value as 1 | 2 | 3 | 4 | 5 });
    };

    const handleAddQuote = () => {
        if (newQuote.trim()) {
            const updatedQuotes = [...quotes, newQuote.trim()];
            setQuotes(updatedQuotes);
            setNewQuote('');
            onUpdate({ ...book, quotes: updatedQuotes });
        }
    };

    const handleRemoveQuote = (index: number) => {
        const updatedQuotes = quotes.filter((_, i) => i !== index);
        setQuotes(updatedQuotes);
        onUpdate({ ...book, quotes: updatedQuotes });
    };

    const handleNotesChange = (value: string) => {
        setNotes(value);
        onUpdate({ ...book, notes: value });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFileName(file.name);
            onUpdate({ ...book, fileName: file.name, fileUrl: URL.createObjectURL(file) });
        }
    };

    const handleUniverseTagSave = () => {
        const trimmedTag = universeTag.trim();
        onUpdate({ ...book, universeTag: trimmedTag || undefined });
        setIsEditingTag(false);
    };

    const handleGenreSave = () => {
        const trimmedGenre = genre.trim();
        onUpdate({ ...book, genre: trimmedGenre || undefined });
    };

    const handleDelete = () => {
        if (isDeleting) {
            onDelete();
        } else {
            setIsDeleting(true);
            setTimeout(() => setIsDeleting(false), 3000);
        }
    };

    useEffect(() => {
        setTargetSeriesId(currentSeriesId);
    }, [currentSeriesId]);

    const handleMoveSubmit = () => {
        if (targetSeriesId && targetSeriesId !== currentSeriesId) {
            onMove(targetSeriesId);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Left Half - Book Display */}
                <div className={styles.leftHalf}>
                    <button className={styles.closeButton} onClick={onClose}>
                        <X size={24} />
                    </button>

                    <div className={styles.bookDisplay}>
                        {/* Book cover */}
                        <div className={styles.bookCover}>
                            {book.coverUrl ? (
                                <img 
                                    src={book.coverUrl} 
                                    alt={book.title}
                                    className={styles.coverImage}
                                />
                            ) : (
                                <BookOpen size={50} />
                            )}
                        </div>

                        <h2 className={styles.bookTitle}>{book.title}</h2>
                        {book.author && <p className={styles.bookAuthor}>by {book.author}</p>}

                        {/* Universe Tag */}
                        <div className={styles.universeTagSection}>
                            {isEditingTag ? (
                                <div className={styles.tagInputWrapper}>
                                    <input
                                        type="text"
                                        className={styles.tagInput}
                                        value={universeTag}
                                        onChange={(e) => setUniverseTag(e.target.value)}
                                        placeholder="e.g., Fantasy, Sci-Fi, Mystery"
                                        autoFocus
                                        onBlur={handleUniverseTagSave}
                                        onKeyDown={(e) => e.key === 'Enter' && handleUniverseTagSave()}
                                    />
                                </div>
                            ) : (
                                <button 
                                    className={`${styles.tagButton} ${book.universeTag ? styles.hasTag : ''}`}
                                    onClick={() => setIsEditingTag(true)}
                                >
                                    <Tag size={12} />
                                    {book.universeTag || 'Add universe tag'}
                                </button>
                            )}
                        </div>

                        {/* Status selector - simplified */}
                        <div className={styles.statusSelector}>
                            <button 
                                className={`${styles.statusBtn} ${book.status === 'unread' ? styles.active : ''}`}
                                onClick={() => onStatusChange('unread')}
                            >
                                <Clock size={14} />
                                To Read
                            </button>
                            <button 
                                className={`${styles.statusBtn} ${book.status === 'read' ? styles.active : ''}`}
                                onClick={() => onStatusChange('read')}
                            >
                                <Check size={14} />
                                Read
                            </button>
                        </div>

                        {/* Date finished */}
                        {book.dateFinished && (
                            <div className={styles.dateSection}>
                                <span>Finished: {new Date(book.dateFinished).toLocaleDateString()}</span>
                            </div>
                        )}

                        <div className={styles.actionsRow}>
                            <button
                                className={`${styles.deleteButton} ${isDeleting ? styles.deleteConfirm : ''}`}
                                onClick={handleDelete}
                                title={isDeleting ? "Click again to confirm" : "Delete Book"}
                            >
                                {isDeleting ? <Check size={18} /> : <Trash2 size={18} />}
                                {isDeleting && <span>Confirm?</span>}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Half - Details */}
                <div className={styles.rightHalf}>
                    {/* Section 1: Rating */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>How did you like it?</h3>
                        <div className={styles.ratingContainer}>
                            {emojiRatings.map((r) => (
                                <button
                                    key={r.value}
                                    className={`${styles.emojiButton} ${rating === r.value ? styles.selected : ''}`}
                                    onClick={() => handleRatingChange(r.value)}
                                    title={r.label}
                                >
                                    {r.emoji}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Section 2: Quotes */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Genre</h3>
                        <input
                            type="text"
                            className={styles.quoteInput}
                            placeholder="e.g., Fantasy, Sci-Fi, Mystery"
                            value={genre}
                            onChange={(e) => setGenre(e.target.value)}
                            onBlur={handleGenreSave}
                            onKeyDown={(e) => e.key === 'Enter' && handleGenreSave()}
                        />
                    </div>

                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Move shelves</h3>
                        <div className={styles.moveControls}>
                            <select
                                value={targetSeriesId}
                                onChange={(e) => setTargetSeriesId(e.target.value)}
                                className={styles.moveSelect}
                            >
                                {seriesOptions.map((series) => (
                                    <option key={series.id} value={series.id}>
                                        {series.name}
                                        {series.universeName ? ` • ${series.universeName}` : ''}
                                    </option>
                                ))}
                            </select>
                            <button
                                className={styles.moveButton}
                                onClick={handleMoveSubmit}
                                disabled={targetSeriesId === currentSeriesId}
                            >
                                Move
                            </button>
                        </div>
                        <p className={styles.moveHint}>
                            Books stay on their shelf even when empty—move anywhere without losing its spot.
                        </p>
                    </div>

                    {/* Section 3: Quotes */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Favorite Quotes</h3>
                        {quotes.length > 0 && (
                            <div className={styles.quotesList}>
                                {quotes.map((quote, index) => (
                                    <div key={index} className={styles.quoteItem}>
                                        &ldquo;{quote}&rdquo;
                                        <button
                                            className={styles.removeQuote}
                                            onClick={() => handleRemoveQuote(index)}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className={styles.addQuoteContainer}>
                            <input
                                type="text"
                                className={styles.quoteInput}
                                placeholder="Add a memorable quote..."
                                value={newQuote}
                                onChange={(e) => setNewQuote(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddQuote()}
                            />
                            <button className={styles.addButton} onClick={handleAddQuote}>
                                Add
                            </button>
                        </div>
                    </div>

                    {/* Section 4: Notes */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Notes</h3>
                        <textarea
                            className={styles.notesTextarea}
                            placeholder="What did you think about this book?"
                            value={notes}
                            onChange={(e) => handleNotesChange(e.target.value)}
                        />
                    </div>

                    {/* Section 5: File Upload */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Upload Book File</h3>
                        <div className={styles.fileUpload}>
                            <input
                                type="file"
                                id="fileUpload"
                                accept=".epub,.pdf"
                                onChange={handleFileUpload}
                                style={{ display: 'none' }}
                            />
                            <label htmlFor="fileUpload" className={styles.fileInput}>
                                {fileName ? fileName : 'Click to upload .epub or .pdf'}
                            </label>
                            {fileName && (
                                <div className={styles.fileName}>
                                    <span>📄 {fileName}</span>
                                    <button
                                        className={styles.removeQuote}
                                        onClick={() => {
                                            setFileName(undefined);
                                            onUpdate({ ...book, fileName: undefined, fileUrl: undefined });
                                        }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
