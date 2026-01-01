import { Series, Book } from '@/app/ember/books/page';
import BookCard from './BookCard';
import styles from './SeriesSection.module.css';

interface SeriesSectionProps {
    series: Series;
    universeId: string;
    onBookClick: (book: Book, universeId: string, seriesId: string) => void;
}

export default function SeriesSection({ series, universeId, onBookClick }: SeriesSectionProps) {
    return (
        <div className={styles.section}>
            <h3 className={styles.sectionTitle}>{series.name}</h3>

            {series.books.length > 0 ? (
                <div className={styles.booksList}>
                    {series.books.map(book => (
                        <BookCard
                            key={book.id}
                            book={book}
                            onClick={() => onBookClick(book, universeId, series.id)}
                        />
                    ))}
                </div>
            ) : (
                <div className={styles.emptySection}>
                    No books yet
                </div>
            )}
        </div>
    );
}
