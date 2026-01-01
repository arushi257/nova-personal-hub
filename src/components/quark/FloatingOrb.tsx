'use client';

import { useEffect, useState } from 'react';
import styles from './FloatingOrb.module.css';

interface Props {
    state: 'focus' | 'shortBreak' | 'longBreak' | 'idle';
    isRunning: boolean;
    showSparkles?: boolean;
}

export default function FloatingOrb({ state, isRunning, showSparkles = false }: Props) {
    const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number }>>([]);

    useEffect(() => {
        if (showSparkles) {
            // Generate sparkles around the orb
            const newSparkles = Array.from({ length: 8 }, (_, i) => ({
                id: Date.now() + i,
                x: Math.cos((i * Math.PI * 2) / 8) * 60,
                y: Math.sin((i * Math.PI * 2) / 8) * 60,
            }));
            setSparkles(newSparkles);

            // Clear sparkles after animation
            const timer = setTimeout(() => setSparkles([]), 2000);
            return () => clearTimeout(timer);
        }
    }, [showSparkles]);

    const getOrbClass = () => {
        let classes = [styles.orb];

        if (state === 'focus') classes.push(styles.focus);
        if (state === 'shortBreak') classes.push(styles.shortBreak);
        if (state === 'longBreak') classes.push(styles.longBreak);
        if (isRunning) classes.push(styles.running);

        return classes.join(' ');
    };

    return (
        <div className={styles.container}>
            <div className={getOrbClass()}>
                <div className={styles.core} />
            </div>

            {sparkles.map(sparkle => (
                <div
                    key={sparkle.id}
                    className={styles.sparkle}
                    style={{
                        left: `calc(50% + ${sparkle.x}px)`,
                        top: `calc(50% + ${sparkle.y}px)`,
                    }}
                />
            ))}
        </div>
    );
}
