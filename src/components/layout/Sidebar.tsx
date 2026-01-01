'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Zap, Book, Music, Brain, Activity, DollarSign, Map, FileText, PenTool, Layout, Calendar, CheckSquare, Timer, Grid3X3, AppWindow } from 'lucide-react';
import styles from './Sidebar.module.css';
import { Pin, PinOff } from 'lucide-react';

// Define wings for each section
const wingsConfig: Record<string, { label: string; icon: any; href: string }[]> = {
    nexus: [
        { label: 'Nexus', icon: Layout, href: '/' },
        { label: 'Wings', icon: Grid3X3, href: '/wings' },
        { label: 'Apps', icon: AppWindow, href: '/apps' },
    ],
    ember: [
        { label: 'Guitar', icon: Music, href: '/ember/guitar' },
        { label: 'Books', icon: Book, href: '/ember/books' },
        { label: 'Visuals', icon: Zap, href: '/ember/visuals' }, // Using Zap as placeholder for Visuals
        { label: 'Brain Teasers', icon: Brain, href: '/ember/teasers' },
    ],
    quark: [
        { label: 'Pomodoro', icon: Timer, href: '/quark/pomodoro' },
        { label: 'To-Do List', icon: CheckSquare, href: '/quark/todo' },
        { label: 'Calendar', icon: Calendar, href: '/quark/calendar' },
    ],
    pulse: [
        { label: 'Habit Tracker', icon: Activity, href: '/pulse/habits' },
        { label: 'Finances', icon: DollarSign, href: '/pulse/finances' },
        { label: 'Travel', icon: Map, href: '/pulse/travel' },
        { label: 'News', icon: FileText, href: '/pulse/news' },
    ],
    forge: [
        { label: 'Notes', icon: FileText, href: '/forge/notes' },
        { label: 'Idea Board', icon: PenTool, href: '/forge/ideas' },
        { label: 'Sheet', icon: Layout, href: '/forge/sheet' },
    ],
};

export default function Sidebar({
    isPinned,
    onTogglePin,
    onHoverChange,
    isExpanded
}: {
    isPinned: boolean;
    onTogglePin: () => void;
    onHoverChange: (hovering: boolean) => void;
    isExpanded: boolean;
}) {
    const pathname = usePathname();
    const [currentSection, setCurrentSection] = useState('nexus');

    useEffect(() => {
        if (pathname === '/') {
            setCurrentSection('nexus');
        } else if (pathname.startsWith('/ember')) {
            setCurrentSection('ember');
        } else if (pathname.startsWith('/quark')) {
            setCurrentSection('quark');
        } else if (pathname.startsWith('/pulse')) {
            setCurrentSection('pulse');
        } else if (pathname.startsWith('/forge')) {
            setCurrentSection('forge');
        }
    }, [pathname]);

    const wings = wingsConfig[currentSection] || wingsConfig.nexus;

    return (
        <aside
            className={`${styles.sidebar} glass-panel ${!isExpanded ? styles.collapsed : ''}`}
            onMouseEnter={() => onHoverChange(true)}
            onMouseLeave={() => onHoverChange(false)}
        >
            <button
                className={`${styles.toggleBtn} ${isPinned ? styles.pinned : ''}`}
                onClick={onTogglePin}
                aria-label={isPinned ? "Unpin Sidebar" : "Pin Sidebar"}
                title={isPinned ? "Unpin Sidebar" : "Pin Sidebar"}
            >
                {isPinned ? <Pin size={14} fill="currentColor" /> : <PinOff size={14} />}
            </button>

            <div className={styles.wings}>
                {wings.map((wing) => (
                    <Link key={wing.href} href={wing.href} className={styles.wingItem}>
                        <span className={styles.wingIcon}>
                            <wing.icon size={20} />
                        </span>
                        <span className={styles.wingLabel}>{wing.label}</span>
                    </Link>
                ))}
            </div>
        </aside>
    );
}
