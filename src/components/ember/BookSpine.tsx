'use client';

import styles from './BookSpine.module.css';

interface Book {
    id: string;
    title: string;
    author?: string;
    coverUrl?: string;
    status: 'unread' | 'read';
    rating?: number;
    universeTag?: string;
}

interface Props {
    book: Book;
    onClick: () => void;
    spineColor?: string;
    isHighlighted?: boolean | null; // null = no filter active, true = matches, false = doesn't match
}

// Rich color palette for book spines
const SPINE_COLORS = [
    { bg: '#8B4513', accent: '#A0522D' },
    { bg: '#6B4423', accent: '#8B5A2B' },
    { bg: '#704214', accent: '#8B6914' },
    { bg: '#5C4033', accent: '#755A46' },
    { bg: '#2C3E50', accent: '#34495E' },
    { bg: '#7D3C3C', accent: '#A04040' },
    { bg: '#2E5439', accent: '#3D6B4A' },
    { bg: '#4A3B5C', accent: '#5E4D70' },
    { bg: '#826644', accent: '#9B7653' },
    { bg: '#5D4E37', accent: '#756245' },
    { bg: '#4B4237', accent: '#635649' },
    { bg: '#8B3A3A', accent: '#A64D4D' },
    { bg: '#3A5F5F', accent: '#4A7373' },
    { bg: '#5A4B82', accent: '#6D5C9E' },
    { bg: '#6B5344', accent: '#8B7355' },
    { bg: '#4A5568', accent: '#5A6578' },
];

export default function BookSpine({ book, onClick, spineColor, isHighlighted }: Props) {
    const hash = book.id.split('').reduce((acc, char, i) => 
        acc + char.charCodeAt(0) * (i + 1), 0);
    
    const titleHash = book.title.split('').reduce((acc, char) => 
        acc + char.charCodeAt(0), 0);

    const titleLen = book.title.length;
    
    // Height: compact base, grows with title
    const baseHeight = 90;
    const heightPerChar = 1.5;
    const maxExtraHeight = 50;
    const extraHeight = Math.min(maxExtraHeight, Math.max(0, (titleLen - 8) * heightPerChar));
    const randomHeight = (hash % 12);
    const calculatedHeight = baseHeight + extraHeight + randomHeight;

    // Width: slim
    const baseWidth = 22;
    const widthVar = 2 + (hash % 6);
    const calculatedWidth = baseWidth + widthVar;

    // Font size scales with title length
    const getFontSize = () => {
        if (titleLen <= 10) return 0.6;
        if (titleLen <= 18) return 0.55;
        if (titleLen <= 28) return 0.5;
        if (titleLen <= 40) return 0.45;
        return 0.4;
    };

    const getColors = () => {
        if (spineColor) {
            return { bg: spineColor, accent: spineColor };
        }
        return SPINE_COLORS[(titleHash + hash) % SPINE_COLORS.length];
    };

    const colors = getColors();
    const fontSize = getFontSize();

    // Randomize tilt for natural look
    const tilt = ((hash % 7) - 3) * 0.3;
    const verticalOffset = -((hash % 6));

    // Determine highlight class
    const getHighlightClass = () => {
        if (isHighlighted === null) return '';
        return isHighlighted ? styles.highlighted : styles.dimmed;
    };

    return (
        <div
            className={`${styles.spine} ${styles[book.status]} ${getHighlightClass()}`}
            onClick={onClick}
            title={`${book.title}${book.author ? ` by ${book.author}` : ''}${book.universeTag ? ` • ${book.universeTag}` : ''}`}
            style={{
                height: `${calculatedHeight}px`,
                width: `${calculatedWidth}px`,
                ['--spine-bg' as string]: colors.bg,
                ['--spine-accent' as string]: colors.accent,
                ['--title-size' as string]: `${fontSize}rem`,
                ['--book-tilt' as string]: `${tilt}deg`,
                ['--book-offset' as string]: `${verticalOffset}px`,
            }}
        >
            <div className={styles.texture} />
            <div className={styles.pageEdges} />

            <div className={styles.spineContent}>
                <span className={styles.title}>{book.title}</span>
            </div>

            {/* Read badge */}
            {book.status === 'read' && (
                <div className={styles.statusBadge}>✓</div>
            )}

            {/* Universe tag indicator */}
            {book.universeTag && (
                <div className={styles.universeIndicator} />
            )}
        </div>
    );
}
