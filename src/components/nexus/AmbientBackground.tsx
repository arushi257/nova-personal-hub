'use client';

import { useTheme } from '@/context/ThemeContext';
import StarryBackground from './StarryBackground';
import styles from './AmbientBackground.module.css';

export default function AmbientBackground() {
    const { theme } = useTheme();

    if (theme === 'dark') {
        return <StarryBackground />;
    }

    // Light theme - elegant gradient with floating shapes
    return (
        <div className={styles.lightBackground}>
            <div className={styles.gradientOverlay} />
            <div className={styles.floatingShapes}>
                <div className={`${styles.shape} ${styles.shape1}`} />
                <div className={`${styles.shape} ${styles.shape2}`} />
                <div className={`${styles.shape} ${styles.shape3}`} />
                <div className={`${styles.shape} ${styles.shape4}`} />
                <div className={`${styles.shape} ${styles.shape5}`} />
            </div>
            <div className={styles.gridPattern} />
        </div>
    );
}

