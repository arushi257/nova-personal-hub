'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
    Music,
    Timer as MetronomeIcon,
    ExternalLink,
    PlayCircle,
    Waves,
    BookOpen,
    ListMusic
} from 'lucide-react';
import scrapedGrades from '@/data/justinguitar-modules.json';
import styles from './page.module.css';

const gradeData = [
    {
        id: 'grade-1',
        title: 'Grade 1',
        focus: 'First chords & rhythm',
        highlights: ['E / A / D chords', 'Down-up strumming', 'One-minute changes'],
        link: 'https://www.justinguitar.com/categories/beginner-guitar-lessons-grade-1',
        modules: [
            {
                title: 'Before You Begin: Guitar Basics',
                lessons: [
                    { label: 'Module link', href: 'https://www.justinguitar.com/modules/before-you-begin-guitar-basics' }
                ]
            },
            {
                title: 'A & D Chords: Play Your First Song!',
                lessons: [
                    { label: 'Module link', href: 'https://www.justinguitar.com/modules/a-d-chords-play-your-first-song' }
                ]
            },
            {
                title: 'Rhythm & Chord Changes + Your First Riff!',
                lessons: [
                    { label: 'Module link', href: 'https://www.justinguitar.com/modules/module-2-the-e-gunn' }
                ]
            },
            {
                title: 'One-Minute Changes & Practice',
                lessons: [
                    { label: 'Module link', href: 'https://www.justinguitar.com/categories/beginner-guitar-lessons-grade-1' }
                ]
            },
            {
                title: 'Strumming Patterns & Timing',
                lessons: [
                    { label: 'Module link', href: 'https://www.justinguitar.com/categories/beginner-guitar-lessons-grade-1' }
                ]
            },
            {
                title: 'Adding New Chords',
                lessons: [
                    { label: 'Module link', href: 'https://www.justinguitar.com/categories/beginner-guitar-lessons-grade-1' }
                ]
            },
            {
                title: 'Song Play-Alongs',
                lessons: [
                    { label: 'Module link', href: 'https://www.justinguitar.com/categories/beginner-guitar-lessons-grade-1' }
                ]
            },
            {
                title: 'Wrap-up & Next Steps',
                lessons: [
                    { label: 'Module link', href: 'https://www.justinguitar.com/categories/beginner-guitar-lessons-grade-1' }
                ]
            }
        ]
    },
    {
        id: 'grade-2',
        title: 'Grade 2',
        focus: 'Chord changes & timing',
        highlights: ['C / G / Am / Em', 'Strumming patterns', 'Anchor fingers'],
        link: 'https://www.justinguitar.com/categories/beginner-guitar-lessons-grade-2',
        modules: [
            {
                title: 'Open Chords',
                lessons: [
                    { label: 'C / G / Am / Em', href: 'https://www.justinguitar.com/categories/beginner-guitar-lessons-grade-2' },
                    { label: 'Anchor fingers', href: 'https://www.justinguitar.com/categories/beginner-guitar-lessons-grade-2' }
                ]
            },
            {
                title: 'Rhythm Builders',
                lessons: [
                    { label: 'Strumming patterns', href: 'https://www.justinguitar.com/categories/beginner-guitar-lessons-grade-2' },
                    { label: 'Counting time', href: 'https://www.justinguitar.com/categories/beginner-guitar-lessons-grade-2' }
                ]
            }
        ]
    },
    {
        id: 'grade-3',
        title: 'Grade 3',
        focus: 'Rhythm confidence',
        highlights: ['Slash chords', '16th-note feel', 'Dynamics'],
        link: 'https://www.justinguitar.com/categories/beginner-guitar-lessons-grade-3',
        modules: [
            {
                title: 'Chord Variations',
                lessons: [
                    { label: 'Slash chords', href: 'https://www.justinguitar.com/categories/beginner-guitar-lessons-grade-3' },
                    { label: 'Chord embellishments', href: 'https://www.justinguitar.com/categories/beginner-guitar-lessons-grade-3' }
                ]
            },
            {
                title: 'Rhythm Feel',
                lessons: [
                    { label: '16th-note strumming', href: 'https://www.justinguitar.com/categories/beginner-guitar-lessons-grade-3' },
                    { label: 'Dynamics & accents', href: 'https://www.justinguitar.com/categories/beginner-guitar-lessons-grade-3' }
                ]
            }
        ]
    },
    {
        id: 'grade-4',
        title: 'Grade 4',
        focus: 'Barre basics',
        highlights: ['E-shape barres', 'Groove practice', 'Song play-alongs'],
        link: 'https://www.justinguitar.com/categories/beginner-guitar-lessons-grade-4',
        modules: [
            {
                title: 'Barre Foundations',
                lessons: [
                    { label: 'E-shape barres', href: 'https://www.justinguitar.com/categories/beginner-guitar-lessons-grade-4' },
                    { label: 'Strength & accuracy', href: 'https://www.justinguitar.com/categories/beginner-guitar-lessons-grade-4' }
                ]
            },
            {
                title: 'Groove Practice',
                lessons: [
                    { label: 'Backing tracks', href: 'https://www.justinguitar.com/categories/beginner-guitar-lessons-grade-4' },
                    { label: 'Song play-alongs', href: 'https://www.justinguitar.com/categories/beginner-guitar-lessons-grade-4' }
                ]
            }
        ]
    },
    {
        id: 'grade-5',
        title: 'Grade 5',
        focus: 'Lead starters',
        highlights: ['Pentatonics', 'Bending & vibrato', 'Call & response'],
        link: 'https://www.justinguitar.com/categories/beginner-guitar-lessons-grade-5',
        modules: [
            {
                title: 'Pentatonic Basics',
                lessons: [
                    { label: 'Box 1 shapes', href: 'https://www.justinguitar.com/categories/beginner-guitar-lessons-grade-5' },
                    { label: 'Call & response', href: 'https://www.justinguitar.com/categories/beginner-guitar-lessons-grade-5' }
                ]
            },
            {
                title: 'Expression',
                lessons: [
                    { label: 'Bending & vibrato', href: 'https://www.justinguitar.com/categories/beginner-guitar-lessons-grade-5' },
                    { label: 'Phrasing ideas', href: 'https://www.justinguitar.com/categories/beginner-guitar-lessons-grade-5' }
                ]
            }
        ]
    },
    {
        id: 'grade-6',
        title: 'Grade 6',
        focus: 'Rhythm & riffs',
        highlights: ['Power chords', 'Riff writing', 'Palm muting'],
        link: 'https://www.justinguitar.com/categories/beginner-guitar-lessons-grade-6',
        modules: [
            {
                title: 'Rock Rhythm',
                lessons: [
                    { label: 'Power chords', href: 'https://www.justinguitar.com/categories/beginner-guitar-lessons-grade-6' },
                    { label: 'Palm muting', href: 'https://www.justinguitar.com/categories/beginner-guitar-lessons-grade-6' }
                ]
            },
            {
                title: 'Riff Lab',
                lessons: [
                    { label: 'Riff writing', href: 'https://www.justinguitar.com/categories/beginner-guitar-lessons-grade-6' },
                    { label: 'Groove variations', href: 'https://www.justinguitar.com/categories/beginner-guitar-lessons-grade-6' }
                ]
            }
        ]
    },
    {
        id: 'grade-7',
        title: 'Grade 7',
        focus: 'Expanding harmony',
        highlights: ['7th chords', 'Transcribing', 'Improvisation feel'],
        link: 'https://www.justinguitar.com/categories/intermediate-guitar-lessons-grade-7',
        modules: [
            {
                title: 'Harmony',
                lessons: [
                    { label: '7th chords', href: 'https://www.justinguitar.com/categories/intermediate-guitar-lessons-grade-7' },
                    { label: 'Chord tone focus', href: 'https://www.justinguitar.com/categories/intermediate-guitar-lessons-grade-7' }
                ]
            },
            {
                title: 'Ear & Improv',
                lessons: [
                    { label: 'Transcribing basics', href: 'https://www.justinguitar.com/categories/intermediate-guitar-lessons-grade-7' },
                    { label: 'Improvisation feel', href: 'https://www.justinguitar.com/categories/intermediate-guitar-lessons-grade-7' }
                ]
            }
        ]
    },
    {
        id: 'grade-8',
        title: 'Grade 8',
        focus: 'Tone & touch',
        highlights: ['Triads all over', 'Phrasing', 'Hybrid picking'],
        link: 'https://www.justinguitar.com/categories/intermediate-guitar-lessons-grade-8',
        modules: [
            {
                title: 'Triads & Shapes',
                lessons: [
                    { label: 'Neck-wide triads', href: 'https://www.justinguitar.com/categories/intermediate-guitar-lessons-grade-8' },
                    { label: 'Voice leading', href: 'https://www.justinguitar.com/categories/intermediate-guitar-lessons-grade-8' }
                ]
            },
            {
                title: 'Technique',
                lessons: [
                    { label: 'Hybrid picking', href: 'https://www.justinguitar.com/categories/intermediate-guitar-lessons-grade-8' },
                    { label: 'Touch & tone', href: 'https://www.justinguitar.com/categories/intermediate-guitar-lessons-grade-8' }
                ]
            }
        ]
    },
    {
        id: 'grade-9',
        title: 'Grade 9',
        focus: 'Advanced repertoire',
        highlights: ['Extended chords', 'Modal colours', 'Performance polish'],
        link: 'https://www.justinguitar.com/categories/intermediate-guitar-lessons-grade-9',
        modules: [
            {
                title: 'Advanced Harmony',
                lessons: [
                    { label: 'Extended chords', href: 'https://www.justinguitar.com/categories/intermediate-guitar-lessons-grade-9' },
                    { label: 'Modal colours', href: 'https://www.justinguitar.com/categories/intermediate-guitar-lessons-grade-9' }
                ]
            },
            {
                title: 'Performance',
                lessons: [
                    { label: 'Repertoire polish', href: 'https://www.justinguitar.com/categories/intermediate-guitar-lessons-grade-9' },
                    { label: 'Tone crafting', href: 'https://www.justinguitar.com/categories/intermediate-guitar-lessons-grade-9' }
                ]
            }
        ]
    }
];

const mergedGradeData = gradeData.map((grade) => {
    const scraped = (scrapedGrades as any[]).find((g) => g.id === grade.id);
    if (scraped?.modules?.length) {
        return {
            ...grade,
            modules: scraped.modules.map((module: { title: string; url: string }) => ({
                title: module.title,
                lessons: [{ label: module.title, href: module.url }]
            }))
        };
    }
    return grade;
});

const tools = [
    {
        title: 'Metronome',
        description: 'Keep time while you practice.',
        href: '#metronome',
        icon: MetronomeIcon
    },
    {
        title: 'Tuner',
        description: 'Quickly tune up before a session.',
        href: 'https://www.justinguitar.com/guitar-tools/online-guitar-tuner',
        icon: Waves
    },
    {
        title: 'Chord Library',
        description: 'Browse shapes and fingerings.',
        href: 'https://www.justinguitar.com/guitar-lessons/learn-chords',
        icon: BookOpen
    },
    {
        title: 'Songbook',
        description: 'Jump to songs to apply what you learn.',
        href: 'https://www.justinguitar.com/songs',
        icon: ListMusic
    }
];

export default function GuitarPage() {
    const [bpm, setBpm] = useState(80);
    const [isPlaying, setIsPlaying] = useState(false);
    const [lastTick, setLastTick] = useState<number | null>(null);
    const [openGradeId, setOpenGradeId] = useState<string | null>('grade-1');
    const [heroGradeId, setHeroGradeId] = useState('grade-1');
    const audioCtxRef = useRef<AudioContext | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const clampBpm = (value: number) => Math.min(220, Math.max(40, Math.round(value)));

    useEffect(() => {
        if (!isPlaying) {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            return;
        }

        const interval = 60000 / bpm;
        timerRef.current = setInterval(() => {
            playClick();
            setLastTick(Date.now());
        }, interval);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [bpm, isPlaying]);

    const playClick = () => {
        try {
            const ctx = audioCtxRef.current ?? new AudioContext();
            audioCtxRef.current = ctx;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = 1000;
            gain.gain.value = 0.1;
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.05);
        } catch {
            // ignore audio errors
        }
    };

    const handleTap = () => {
        const now = Date.now();
        if (lastTick) {
            const diff = now - lastTick;
            const calculated = Math.min(220, Math.max(40, Math.round(60000 / diff)));
            setBpm(calculated);
        }
        setLastTick(now);
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const saved = localStorage.getItem('ember-guitar-grade');
        if (saved) {
            setOpenGradeId(saved);
            setHeroGradeId(saved);
        }
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        localStorage.setItem('ember-guitar-grade', heroGradeId);
    }, [heroGradeId]);

    const handleGradeToggle = (gradeId: string) => {
        setOpenGradeId((prev) => (prev === gradeId ? null : gradeId));
        setHeroGradeId(gradeId);
    };

    const handleGradeSelect = (gradeId: string) => {
        setOpenGradeId(gradeId);
        setHeroGradeId(gradeId);
    };

    const heroGrade = mergedGradeData.find((grade) => grade.id === heroGradeId) ?? mergedGradeData[0];
    const heroHighlights = heroGrade.highlights.slice(0, 3).join(' • ');

    return (
        <div className={styles.container}>
            <header className={styles.hero}>
                <div className={styles.heroIcon}>
                    <Music size={56} strokeWidth={1.4} />
                </div>
                <div>
                    <p className={styles.kicker}>Learning • JustinGuitar powered</p>
                    <h1 className={styles.title}>Guitar Page</h1>
                    <p className={styles.subtitle}>Follow Grades 1–9, practice with tools, and jump to songs without leaving the flow.</p>
                    <p className={styles.heroFocus}>Current focus: {heroGrade.focus}</p>
                    <p className={styles.heroMeta}>Highlights: {heroHighlights}</p>
                    <div className={styles.heroActions}>
                        <Link className={styles.primaryButton} href={`#${heroGrade.id}`}>
                            <PlayCircle size={18} /> Continue {heroGrade.title}
                        </Link>
                        <Link className={styles.secondaryButton} href="#metronome">
                            <MetronomeIcon size={18} /> Open metronome
                        </Link>
                    </div>
                </div>
            </header>

            <nav className={styles.nav}>
                <a className={styles.navChip} href="#courses">Courses</a>
                <a className={styles.navChip} href="#songs">Songs</a>
                <a className={styles.navChip} href="#tools">Tools</a>
            </nav>

            <section id="metronome" className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div>
                        <p className={styles.kicker}>Metronome</p>
                        <h2 className={styles.sectionTitle}>Stay on time</h2>
                        <p className={styles.sectionSubtitle}>
                            Tap to set tempo, then start. Pinned at the top so it’s always within reach.
                        </p>
                    </div>
                    <button
                        className={styles.tapButton}
                        type="button"
                        onClick={handleTap}
                        aria-label="Tap tempo"
                    >
                        Tap tempo
                    </button>
                </div>
                <div className={styles.metronome}>
                    <div className={styles.metronomeControls}>
                        <div className={styles.bpmDisplay}>
                            <span className={styles.bpmValue}>{bpm}</span>
                            <span className={styles.bpmLabel}>BPM</span>
                        </div>
                        <input
                            type="range"
                            min={40}
                            max={220}
                            value={bpm}
                            onChange={(e) => setBpm(clampBpm(parseInt(e.target.value, 10)))}
                            className={styles.bpmSlider}
                        />
                        <div className={styles.bpmActions}>
                            <input
                                type="number"
                                min={40}
                                max={220}
                                value={bpm}
                                onChange={(e) => setBpm(clampBpm(parseInt(e.target.value, 10) || bpm))}
                                className={styles.bpmNumber}
                                aria-label="Set BPM"
                            />
                            <button type="button" onClick={() => setBpm((v) => clampBpm(v - 1))}>
                                -1
                            </button>
                            <button type="button" onClick={() => setIsPlaying((p) => !p)} className={styles.playButton}>
                                {isPlaying ? 'Stop' : 'Start'}
                            </button>
                            <button type="button" onClick={() => setBpm((v) => clampBpm(v + 1))}>
                                +1
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <section id="courses" className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div>
                        <p className={styles.kicker}>Courses</p>
                        <h2 className={styles.sectionTitle}>Grades 1–9</h2>
                        <p className={styles.sectionSubtitle}>Progressive path from first chords to advanced repertoire.</p>
                    </div>
                    <div className={styles.gradeNav}>
                        {mergedGradeData.map((grade) => (
                    <a
                        key={grade.id}
                        href={`#${grade.id}-modules`}
                        className={styles.gradeChip}
                        onClick={() => handleGradeSelect(grade.id)}
                    >
                        {grade.title}
                    </a>
                        ))}
                    </div>
                </div>

                <div className={styles.gradeGrid}>
                    {mergedGradeData.map((grade) => (
                        <div
                            key={grade.id}
                            id={grade.id}
                            className={`${styles.gradeCard} ${openGradeId === grade.id ? styles.gradeCardOpen : styles.gradeCardClosed}`}
                        >
                            <button
                                type="button"
                                className={styles.gradeTop}
                                aria-expanded={openGradeId === grade.id}
                                onClick={() => handleGradeToggle(grade.id)}
                            >
                                <div className={styles.gradeBadge}>{grade.title}</div>
                                <span className={styles.gradeFocus}>{grade.focus}</span>
                            </button>
                            {openGradeId === grade.id && (
                                <>
                                    <ul className={styles.highlightList}>
                                        {grade.highlights.map((item) => (
                                            <li key={item}>{item}</li>
                                        ))}
                                    </ul>
                                    {grade.modules && (
                                        <div className={styles.moduleGrid} id={`${grade.id}-modules`}>
                                            {grade.modules.map((module, moduleIndex) => {
                                                const moduleUrl = (module as { url?: string }).url || 
                                                    (module.lessons && module.lessons[0]?.href) || 
                                                    grade.link;
                                                return (
                                                    <div key={module.title} className={styles.moduleCard}>
                                                        <span className={styles.moduleNumber}>Module {moduleIndex + 1}</span>
                                                        <div className={styles.moduleHeader}>
                                                            <span className={styles.moduleTitle}>{module.title}</span>
                                                        </div>
                                                        <Link
                                                            href={moduleUrl}
                                                            target="_blank"
                                                            className={styles.viewAllLink}
                                                        >
                                                            View all lessons <ExternalLink size={11} />
                                                        </Link>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    <Link href={grade.link} className={styles.textLink} target="_blank">
                                        Enter {grade.title} <ExternalLink size={14} />
                                    </Link>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            <section id="songs" className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div>
                        <p className={styles.kicker}>Songs</p>
                        <h2 className={styles.sectionTitle}>Play-along hub</h2>
                        <p className={styles.sectionSubtitle}>
                            Jump straight to the JustinGuitar songs library to apply what you’re learning.
                        </p>
                    </div>
                </div>
                <div className={styles.callout}>
                    <div>
                        <h3 className={styles.calloutTitle}>Browse songs by level, artist, or style</h3>
                        <p className={styles.calloutBody}>
                            Filter for your current grade, add to your practice list, and loop tricky sections with the
                            metronome.
                        </p>
                    </div>
                    <Link href="https://www.justinguitar.com/songs" className={styles.primaryButton} target="_blank">
                        Go to Songs <ExternalLink size={16} />
                    </Link>
                </div>
            </section>

            <section id="tools" className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div>
                        <p className={styles.kicker}>Tools</p>
                        <h2 className={styles.sectionTitle}>Practice essentials</h2>
                        <p className={styles.sectionSubtitle}>
                            Keep everything close: metronome, tuner, chord shapes, and quick links.
                        </p>
                    </div>
                </div>
                <div className={styles.toolsGrid}>
                    {tools.map((tool) => (
                        <Link
                            key={tool.title}
                            href={tool.href}
                            className={styles.toolCard}
                            target={tool.href.startsWith('http') ? '_blank' : undefined}
                        >
                            <div className={styles.toolIcon}>
                                <tool.icon size={18} />
                            </div>
                            <div>
                                <p className={styles.toolTitle}>{tool.title}</p>
                                <p className={styles.toolDesc}>{tool.description}</p>
                            </div>
                            <ExternalLink size={14} className={styles.toolExternal} />
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}
