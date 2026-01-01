'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Settings } from 'lucide-react';
import styles from './page.module.css';
import FloatingOrb from '@/components/quark/FloatingOrb';
import AmbientSounds from '@/components/quark/AmbientSounds';

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

interface PomodoroSettings {
    focusMinutes: number;
    shortBreakMinutes: number;
    longBreakMinutes: number;
    longBreakInterval: number;
    autoStartBreaks: boolean;
    autoStartPomodoros: boolean;
    soundEnabled: boolean;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
    focusMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    longBreakInterval: 4,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    soundEnabled: true,
};

export default function PomodoroPage() {
    const [mode, setMode] = useState<TimerMode>('focus');
    const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
    const [isRunning, setIsRunning] = useState(false);
    const [pomodorosCompleted, setPomodorosCompleted] = useState(0);
    const [showSparkles, setShowSparkles] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [timerCompleted, setTimerCompleted] = useState(false); // Guard against multiple completions

    // Settings - loaded from localStorage
    const [focusMinutes, setFocusMinutes] = useState(DEFAULT_SETTINGS.focusMinutes);
    const [shortBreakMinutes, setShortBreakMinutes] = useState(DEFAULT_SETTINGS.shortBreakMinutes);
    const [longBreakMinutes, setLongBreakMinutes] = useState(DEFAULT_SETTINGS.longBreakMinutes);
    const [longBreakInterval, setLongBreakInterval] = useState(DEFAULT_SETTINGS.longBreakInterval);
    const [autoStartBreaks, setAutoStartBreaks] = useState(DEFAULT_SETTINGS.autoStartBreaks);
    const [autoStartPomodoros, setAutoStartPomodoros] = useState(DEFAULT_SETTINGS.autoStartPomodoros);
    const [soundEnabled, setSoundEnabled] = useState(DEFAULT_SETTINGS.soundEnabled);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Load settings from localStorage on mount
    useEffect(() => {
        const savedSettings = localStorage.getItem('pomodoro-settings');
        if (savedSettings) {
            try {
                const settings: PomodoroSettings = JSON.parse(savedSettings);
                setFocusMinutes(settings.focusMinutes);
                setShortBreakMinutes(settings.shortBreakMinutes);
                setLongBreakMinutes(settings.longBreakMinutes);
                setLongBreakInterval(settings.longBreakInterval);
                setAutoStartBreaks(settings.autoStartBreaks);
                setAutoStartPomodoros(settings.autoStartPomodoros);
                setSoundEnabled(settings.soundEnabled ?? true);
                // Set initial time based on loaded settings
                setTimeLeft(settings.focusMinutes * 60);
            } catch (e) {
                console.error('Error loading pomodoro settings:', e);
            }
        }

        const savedPomodoros = localStorage.getItem('pomodoro-completed-today');
        if (savedPomodoros) {
            const { count, date } = JSON.parse(savedPomodoros);
            // Only restore if same day
            if (new Date(date).toDateString() === new Date().toDateString()) {
                setPomodorosCompleted(count);
            }
        }

        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // Save settings to localStorage whenever they change
    useEffect(() => {
        const settings: PomodoroSettings = {
            focusMinutes,
            shortBreakMinutes,
            longBreakMinutes,
            longBreakInterval,
            autoStartBreaks,
            autoStartPomodoros,
            soundEnabled,
        };
        localStorage.setItem('pomodoro-settings', JSON.stringify(settings));
    }, [focusMinutes, shortBreakMinutes, longBreakMinutes, longBreakInterval, autoStartBreaks, autoStartPomodoros, soundEnabled]);

    // Save pomodoros completed
    useEffect(() => {
        localStorage.setItem('pomodoro-completed-today', JSON.stringify({
            count: pomodorosCompleted,
            date: new Date().toISOString(),
        }));
    }, [pomodorosCompleted]);

    // Play notification sound
    const playNotificationSound = useCallback(() => {
        if (!soundEnabled) return;
        
        // Create a simple beep using Web Audio API
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.log('Could not play notification sound');
        }
    }, [soundEnabled]);

    // Show desktop notification
    const showNotification = useCallback((title: string, body: string) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body, icon: '/favicon.ico' });
        }
        playNotificationSound();
    }, [playNotificationSound]);

    // Handle timer completion - memoized to prevent stale closures
    const handleTimerComplete = useCallback(() => {
        if (timerCompleted) return; // Guard against multiple calls
        setTimerCompleted(true);
        setIsRunning(false);

        if (mode === 'focus') {
            setPomodorosCompleted(prev => prev + 1);
            setShowSparkles(true);
            setTimeout(() => setShowSparkles(false), 2000);
            
            showNotification('🍅 Focus Complete!', 'Great work! Time for a break.');

            // Auto-switch to break
            const nextMode = (pomodorosCompleted + 1) % longBreakInterval === 0 ? 'longBreak' : 'shortBreak';
            const nextTime = nextMode === 'longBreak' ? longBreakMinutes * 60 : shortBreakMinutes * 60;
            
            setMode(nextMode);
            setTimeLeft(nextTime);
            setTimerCompleted(false);

            // Auto-start break if enabled
            if (autoStartBreaks) {
                setTimeout(() => setIsRunning(true), 1000);
            }
        } else {
            showNotification('☕ Break Complete!', 'Ready to focus again?');
            
            // Break complete, switch to focus
            setMode('focus');
            setTimeLeft(focusMinutes * 60);
            setTimerCompleted(false);

            // Auto-start pomodoro if enabled
            if (autoStartPomodoros) {
                setTimeout(() => setIsRunning(true), 1000);
            }
        }
    }, [mode, pomodorosCompleted, longBreakInterval, autoStartBreaks, autoStartPomodoros, focusMinutes, shortBreakMinutes, longBreakMinutes, timerCompleted, showNotification]);

    // Timer logic - cleaner implementation
    useEffect(() => {
        if (!isRunning) {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            return;
        }

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    // Clear interval immediately to prevent negative values
                    if (timerRef.current) {
                        clearInterval(timerRef.current);
                        timerRef.current = null;
                    }
                    // Schedule completion for next tick to avoid state update during render
                    setTimeout(() => handleTimerComplete(), 0);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [isRunning, handleTimerComplete]);

    const switchMode = (newMode: TimerMode) => {
        setMode(newMode);
        setIsRunning(false);
        setTimerCompleted(false); // Reset completion guard

        switch (newMode) {
            case 'focus':
                setTimeLeft(focusMinutes * 60);
                break;
            case 'shortBreak':
                setTimeLeft(shortBreakMinutes * 60);
                break;
            case 'longBreak':
                setTimeLeft(longBreakMinutes * 60);
                break;
        }
    };

    const toggleTimer = () => {
        setIsRunning(!isRunning);
    };

    const resetTimer = () => {
        setIsRunning(false);
        setTimerCompleted(false); // Reset completion guard
        switch (mode) {
            case 'focus':
                setTimeLeft(focusMinutes * 60);
                break;
            case 'shortBreak':
                setTimeLeft(shortBreakMinutes * 60);
                break;
            case 'longBreak':
                setTimeLeft(longBreakMinutes * 60);
                break;
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getProgress = () => {
        const totalSeconds = mode === 'focus'
            ? focusMinutes * 60
            : mode === 'shortBreak'
                ? shortBreakMinutes * 60
                : longBreakMinutes * 60;
        return ((totalSeconds - timeLeft) / totalSeconds) * 100;
    };

    return (
        <div className={`${styles.container} ${styles[mode]}`}>
            {/* Atmospheric layers */}
            <div className={styles.particles} />
            <div className={styles.vignette} />

            {/* Floating Orb Mascot */}
            <FloatingOrb
                state={mode}
                isRunning={isRunning}
                showSparkles={showSparkles}
            />

            {/* Main Content */}
            <div className={styles.content}>
                {/* Mode Tabs */}
                <div className={styles.modeTabs}>
                    <button
                        className={`${styles.modeTab} ${mode === 'focus' ? styles.active : ''}`}
                        onClick={() => switchMode('focus')}
                    >
                        Focus
                    </button>
                    <button
                        className={`${styles.modeTab} ${mode === 'shortBreak' ? styles.active : ''}`}
                        onClick={() => switchMode('shortBreak')}
                    >
                        Short Break
                    </button>
                    <button
                        className={`${styles.modeTab} ${mode === 'longBreak' ? styles.active : ''}`}
                        onClick={() => switchMode('longBreak')}
                    >
                        Long Break
                    </button>
                </div>

                {/* Timer Display */}
                <div className={styles.timerCard}>
                    <svg className={styles.progressRing} width="320" height="320">
                        <circle
                            className={styles.progressRingCircle}
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="8"
                            fill="transparent"
                            r="150"
                            cx="160"
                            cy="160"
                        />
                        <circle
                            className={styles.progressRingProgress}
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            r="150"
                            cx="160"
                            cy="160"
                            style={{
                                strokeDasharray: `${2 * Math.PI * 150}`,
                                strokeDashoffset: `${2 * Math.PI * 150 * (1 - getProgress() / 100)}`,
                            }}
                        />
                    </svg>

                    <div className={styles.timerContent}>
                        <div className={styles.timeDisplay}>{formatTime(timeLeft)}</div>
                        <div className={styles.modeLabel}>
                            {mode === 'focus' ? 'FOCUS TIME' : mode === 'shortBreak' ? 'SHORT BREAK' : 'LONG BREAK'}
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className={styles.controls}>
                    <button
                        className={`${styles.controlBtn} ${styles.primary}`}
                        onClick={toggleTimer}
                    >
                        {isRunning ? 'PAUSE' : 'START'}
                    </button>
                    <button
                        className={styles.controlBtn}
                        onClick={resetTimer}
                    >
                        RESET
                    </button>
                </div>

                {/* Session Counter */}
                <div className={styles.sessionCounter}>
                    <span className={styles.counterLabel}>Pomodoros Completed:</span>
                    <span className={styles.counterValue}>{pomodorosCompleted}</span>
                    <button
                        className={styles.endSessionBtn}
                        onClick={() => setPomodorosCompleted(0)}
                        title="End Session"
                    >
                        End Session
                    </button>
                </div>

                {/* Ambient Sounds */}
                <AmbientSounds />

                {/* Settings Button */}
                <button
                    className={styles.settingsBtn}
                    onClick={() => setShowSettings(!showSettings)}
                >
                    <Settings size={20} />
                </button>
            </div>

            {/* Settings Sidebar */}
            <div className={`${styles.settingsSidebar} ${showSettings ? styles.open : ''}`}>
                <div className={styles.sidebarHeader}>
                    <h2>Timer Settings</h2>
                    <button onClick={() => setShowSettings(false)} className={styles.closeBtn}>×</button>
                </div>

                <div className={styles.sidebarContent}>
                    <div className={styles.settingGroup}>
                        <label>Focus Duration</label>
                        <div className={styles.inputGroup}>
                            <input
                                type="number"
                                value={focusMinutes}
                                onChange={(e) => setFocusMinutes(Number(e.target.value))}
                                min="1"
                                max="60"
                            />
                            <span>minutes</span>
                        </div>
                    </div>

                    <div className={styles.settingGroup}>
                        <label>Short Break</label>
                        <div className={styles.inputGroup}>
                            <input
                                type="number"
                                value={shortBreakMinutes}
                                onChange={(e) => setShortBreakMinutes(Number(e.target.value))}
                                min="1"
                                max="30"
                            />
                            <span>minutes</span>
                        </div>
                    </div>

                    <div className={styles.settingGroup}>
                        <label>Long Break</label>
                        <div className={styles.inputGroup}>
                            <input
                                type="number"
                                value={longBreakMinutes}
                                onChange={(e) => setLongBreakMinutes(Number(e.target.value))}
                                min="1"
                                max="60"
                            />
                            <span>minutes</span>
                        </div>
                    </div>

                    <div className={styles.settingGroup}>
                        <label>Long Break After</label>
                        <div className={styles.inputGroup}>
                            <input
                                type="number"
                                value={longBreakInterval}
                                onChange={(e) => setLongBreakInterval(Number(e.target.value))}
                                min="1"
                                max="10"
                            />
                            <span>pomodoros</span>
                        </div>
                    </div>

                    <div className={styles.settingGroup}>
                        <label>
                            <input
                                type="checkbox"
                                checked={autoStartBreaks}
                                onChange={(e) => setAutoStartBreaks(e.target.checked)}
                                className={styles.checkbox}
                            />
                            <span>Auto-start Breaks</span>
                        </label>
                    </div>

                    <div className={styles.settingGroup}>
                        <label>
                            <input
                                type="checkbox"
                                checked={autoStartPomodoros}
                                onChange={(e) => setAutoStartPomodoros(e.target.checked)}
                                className={styles.checkbox}
                            />
                            <span>Auto-start Pomodoros</span>
                        </label>
                    </div>

                    <div className={styles.settingGroup}>
                        <label>
                            <input
                                type="checkbox"
                                checked={soundEnabled}
                                onChange={(e) => setSoundEnabled(e.target.checked)}
                                className={styles.checkbox}
                            />
                            <span>🔔 Sound Notifications</span>
                        </label>
                    </div>

                    <div className={styles.settingInfo}>
                        <p>💡 Settings are saved automatically</p>
                        <p>🍅 {pomodorosCompleted} Pomodoros completed today</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
