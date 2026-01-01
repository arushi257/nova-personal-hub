'use client';

import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import styles from './ThemeToggle.module.css';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            className={styles.toggle}
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
            <div className={styles.iconWrapper}>
                <Sun 
                    className={`${styles.icon} ${styles.sunIcon} ${theme === 'light' ? styles.active : ''}`} 
                    size={20} 
                />
                <Moon 
                    className={`${styles.icon} ${styles.moonIcon} ${theme === 'dark' ? styles.active : ''}`} 
                    size={20} 
                />
            </div>
            <span className={styles.label}>
                {theme === 'dark' ? 'Dark' : 'Light'}
            </span>
        </button>
    );
}

