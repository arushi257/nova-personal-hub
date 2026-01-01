'use client';

import { useState } from 'react';
import styles from './AmbientSounds.module.css';

type SoundType = 'rain' | 'cafe' | 'fireplace' | null;

export default function AmbientSounds() {
    const [activeSound, setActiveSound] = useState<SoundType>(null);

    const toggleSound = (sound: SoundType) => {
        if (activeSound === sound) {
            setActiveSound(null);
            // Stop audio
        } else {
            setActiveSound(sound);
            // Play audio
        }
    };

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>Ambient Sounds</h3>

            <div className={styles.soundOptions}>
                <button
                    className={`${styles.soundCard} ${activeSound === 'rain' ? styles.active : ''}`}
                    onClick={() => toggleSound('rain')}
                >
                    <div className={styles.icon}>🌧️</div>
                    <div className={styles.label}>Gentle Rain</div>
                </button>

                <button
                    className={`${styles.soundCard} ${activeSound === 'cafe' ? styles.active : ''}`}
                    onClick={() => toggleSound('cafe')}
                >
                    <div className={styles.icon}>☕</div>
                    <div className={styles.label}>Café Hum</div>
                </button>

                <button
                    className={`${styles.soundCard} ${activeSound === 'fireplace' ? styles.active : ''}`}
                    onClick={() => toggleSound('fireplace')}
                >
                    <div className={styles.icon}>🔥</div>
                    <div className={styles.label}>Fireplace</div>
                </button>
            </div>
        </div>
    );
}
