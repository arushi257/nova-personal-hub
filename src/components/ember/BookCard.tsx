import { Book } from '@/app/ember/books/page';
import { Check, Circle } from 'lucide-react';
import styles from './BookCard.module.css';

interface BookCardProps {
    book: Book;
    onClick: () => void;
}

export default function BookCard({ book, onClick }: BookCardProps) {
    return (
        <div
            className={`${styles.card} ${book.read ? styles.cardRead : ''}`}
            onClick={onClick}
        >
            <div className={styles.content}>
                <div className={styles.title}>{book.title}</div>
                {book.author && <div className={styles.author}>by {book.author}</div>}
            </div>

            <div className={`${styles.readBadge} ${!book.read ? styles.notReadBadge : ''}`}>
                {book.read ? <Check size={16} /> : <Circle size={16} />}
                {book.read ? 'Read' : 'Mark Read'}
            </div>
        </div>
    );
}
