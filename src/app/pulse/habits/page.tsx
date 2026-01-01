'use client';

import { useState, forwardRef } from 'react';
import {
    ChevronLeft, ChevronRight, Plus, Check, MessageSquare,
    BarChart2, Calendar, Grid, List as ListIcon, Droplets, Zap, Shield, Activity, Settings, Edit2, X
} from 'lucide-react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styles from './page.module.css';
import { Habit, HabitType, Category, DailyLog } from './types';

// --- MOCK DATA ---
const INITIAL_HABITS: Habit[] = [
    {
        id: '1', name: 'Deep Work', type: 'daily-task', category: 'Work',
        frequencyPerWeek: 5, streakResetGap: 1, requireNote: false, isPaused: false,
        currentStreak: 15, longestStreak: 20, totalCompletions: 45
    },
    {
        id: '2', name: 'Read 30m', type: 'daily-task', category: 'Learning',
        frequencyPerWeek: 7, streakResetGap: 1, requireNote: false, isPaused: false,
        currentStreak: 5, longestStreak: 12, totalCompletions: 20
    },
    {
        id: '3', name: 'Water Intake', type: 'metric', category: 'Health',
        targetValue: 2.0, unit: 'L',
        frequencyPerWeek: 7, streakResetGap: 1, requireNote: false, isPaused: false,
        currentStreak: 4, longestStreak: 12, totalCompletions: 28
    },
    {
        id: '4', name: 'Sleep Log', type: 'metric', category: 'Health',
        targetValue: 7.5, unit: 'h',
        frequencyPerWeek: 7, streakResetGap: 1, requireNote: false, isPaused: false,
        currentStreak: 2, longestStreak: 5, totalCompletions: 10
    },
    {
        id: '5', name: 'No Social Media', type: 'anti-habit', category: 'Health',
        frequencyPerWeek: 7, streakResetGap: 1, requireNote: false, isPaused: false,
        currentStreak: 3, longestStreak: 7, totalCompletions: 14
    }
];

// Custom Date Input
const DateCustomInput = forwardRef(({ value, onClick }: any, ref: any) => (
    <span className={styles.dateLabel} onClick={onClick} ref={ref} style={{ cursor: 'pointer' }}>
        {value}
    </span>
));

// Allow display name for debugging
DateCustomInput.displayName = 'DateCustomInput';

export default function HabitsPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [habits, setHabits] = useState<Habit[]>(INITIAL_HABITS);
    const [logs, setLogs] = useState<DailyLog[]>([]);

    // View State
    const [analyticsView, setAnalyticsView] = useState<'chart' | 'heatmap' | 'annual'>('chart');

    // Wizard State
    const [showWizard, setShowWizard] = useState(false);
    const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
    const [habitForm, setHabitForm] = useState<Partial<Habit>>({
        type: 'daily-task',
        category: 'Health',
        streakResetGap: 1
    });

    // Note Modal State
    const [noteModalHabitId, setNoteModalHabitId] = useState<string | null>(null);
    const [currentNote, setCurrentNote] = useState('');

    // --- COMPUTED ---
    const dateKey = currentDate.toISOString().split('T')[0];
    const getLog = (habitId: string) => logs.find(l => l.habitId === habitId && l.date === dateKey);

    const dailyTasks = habits.filter(h => h.type === 'daily-task');
    const metrics = habits.filter(h => h.type === 'metric');
    const antiHabits = habits.filter(h => h.type === 'anti-habit');

    const totalHabits = habits.length;
    const completedCount = habits.filter(h => {
        const log = getLog(h.id);
        if (!log) return false;
        if (h.type === 'daily-task' || h.type === 'anti-habit') return log.completed;
        if (h.type === 'metric') return (log.value || 0) >= (h.targetValue || 0);
        return false;
    }).length;
    const completionPercent = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;

    // --- ACTIONS ---
    const toggleLog = (habitId: string) => {
        const existing = getLog(habitId);
        if (existing) {
            const updated: DailyLog = { ...existing, completed: !existing.completed };
            setLogs(logs.map(l => l.id === existing.id ? updated : l));
        } else {
            const newLog: DailyLog = {
                id: Date.now().toString(),
                habitId,
                date: dateKey,
                completed: true,
                timestamp: Date.now()
            };
            setLogs([...logs, newLog]);
        }
    };

    const shiftDate = (offset: number) => {
        setCurrentDate((prev) => {
            const next = new Date(prev);
            next.setDate(next.getDate() + offset);
            return next;
        });
    };

    const updateMetric = (habitId: string, rawValue: string) => {
        const existing = getLog(habitId);
        const target = habits.find(h => h.id === habitId)?.targetValue || 0;
        const parsed = rawValue === '' ? undefined : parseFloat(rawValue);
        if (parsed !== undefined && Number.isNaN(parsed)) return;

        if (existing) {
            setLogs(logs.map(l => l.id === existing.id ? {
                ...l,
                value: parsed,
                completed: parsed !== undefined ? parsed >= target : false
            } : l));
        } else if (parsed !== undefined) {
            const newLog: DailyLog = {
                id: Date.now().toString(),
                habitId,
                date: dateKey,
                completed: parsed >= target,
                value: parsed,
                timestamp: Date.now()
            };
            setLogs([...logs, newLog]);
        }
    };

    const openNoteModal = (habitId: string) => {
        const log = getLog(habitId);
        setCurrentNote(log?.note || '');
        setNoteModalHabitId(habitId);
    };

    const saveNote = () => {
        if (!noteModalHabitId) return;
        const existing = getLog(noteModalHabitId);
        if (existing) {
            setLogs(logs.map(l => l.id === existing.id ? { ...l, note: currentNote } : l));
        } else {
            const newLog: DailyLog = {
                id: Date.now().toString(),
                habitId: noteModalHabitId,
                date: dateKey,
                completed: false,
                note: currentNote,
                timestamp: Date.now()
            };
            setLogs([...logs, newLog]);
        }
        setNoteModalHabitId(null);
        setCurrentNote('');
    };

    // Wizard Actions
    const openAddWizard = () => {
        setEditingHabitId(null);
        setHabitForm({ type: 'daily-task', category: 'Health', streakResetGap: 1 });
        setShowWizard(true);
    };

    const openEditWizard = (habit: Habit) => {
        setEditingHabitId(habit.id);
        setHabitForm({ ...habit });
        setShowWizard(true);
    };

    const saveHabit = () => {
        // VALIDATION: Name must not be empty
        if (!habitForm.name || habitForm.name.trim().length === 0) {
            const nameInput = document.getElementById('habitNameInput');
            if (nameInput) {
                nameInput.style.borderColor = '#EF4444';
                nameInput.focus();
            }
            return;
        }

        if (editingHabitId) {
            setHabits(habits.map(h => h.id === editingHabitId ? { ...h, ...habitForm } as Habit : h));
        } else {
            const habit: Habit = {
                id: Date.now().toString(),
                name: habitForm.name,
                type: habitForm.type || 'daily-task',
                category: habitForm.category || 'Health',
                frequencyPerWeek: 7, // Default
                targetValue: habitForm.targetValue,
                unit: habitForm.unit,
                streakResetGap: habitForm.streakResetGap || 1,
                requireNote: false,
                isPaused: false,
                currentStreak: 0,
                longestStreak: 0,
                totalCompletions: 0,
                ...habitForm
            } as Habit;
            setHabits([...habits, habit]);
        }
        setShowWizard(false);
    };

    const renderHabitCard = (habit: Habit) => {
        const log = getLog(habit.id);
        const hasNote = log?.note && log.note.trim().length > 0;

        return (
            <div key={habit.id} className={styles.habitCard}>
                <div className={styles.habitInfo}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
                        <div>
                            <h3 style={{ fontSize: '1rem', margin: 0 }}>{habit.name}</h3>
                            <div style={{ fontSize: '0.8rem', color: '#737373', marginTop: 2 }}>
                                {habit.type !== 'metric' && `🔥 ${habit.currentStreak}`}
                                {habit.type === 'metric' && `Goal: ${habit.targetValue}${habit.unit}`}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                            <button
                                className={styles.iconBtn}
                                onClick={() => openNoteModal(habit.id)}
                                title="Add Note"
                                style={{ color: hasNote ? '#60A5FA' : undefined }}
                            >
                                <MessageSquare size={14} fill={hasNote ? "currentColor" : "none"} />
                            </button>
                            <button className={styles.iconBtn} onClick={() => openEditWizard(habit)} title="Edit Settings">
                                <Settings size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className={styles.cardAction} style={{ marginTop: '0.8rem' }}>
                    {habit.type === 'metric' ? (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', width: '100%' }}>
                            <input
                                type="number"
                                className={styles.inputMetric}
                                value={log?.value ?? ''}
                                placeholder="0"
                                onChange={(e) => updateMetric(habit.id, e.target.value)}
                            />
                            <span style={{ fontSize: '0.85rem', color: '#737373' }}>{habit.unit}</span>
                            {log?.completed && <Check size={16} color="#10B981" style={{ marginLeft: 'auto' }} />}
                        </div>
                    ) : (
                        <button
                            className={`${styles.actionBtn} ${habit.type === 'anti-habit' ? styles.btnAnti : styles.btnDone} ${log?.completed ? (habit.type === 'anti-habit' ? styles.success : styles.completed) : ''}`}
                            onClick={() => toggleLog(habit.id)}
                            style={{ width: '100%' }}
                        >
                            {habit.type === 'anti-habit' ? (
                                log?.completed ? <><Shield size={16} /> Secured</> : <><Shield size={16} /> No Slip</>
                            ) : (
                                log?.completed ? <><Check size={16} /> Done</> : "Mark Done"
                            )}
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerTitle}>
                    <h1>Habits & Streaks</h1>
                    <div className={styles.dateNav}>
                        <button className={styles.navBtn} onClick={() => shiftDate(-1)}>
                            <ChevronLeft size={20} />
                        </button>

                        <DatePicker
                            selected={currentDate}
                            onChange={(date: Date | null) => date && setCurrentDate(date)}
                            customInput={<DateCustomInput />}
                            dateFormat="EEE, MMM d"
                            title="Click to change date"
                        />

                        <button className={styles.navBtn} onClick={() => shiftDate(1)}>
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
                <button className={styles.btnSecondary} onClick={openAddWizard}>
                    <Plus size={18} style={{ marginRight: 6 }} /> Add Habit
                </button>
            </div>

            <div className={styles.scoreCard} style={{ marginBottom: '3rem', padding: '1.5rem', flexDirection: 'row', gap: '2rem', justifyContent: 'flex-start' }}>
                <div className={styles.circleWrap} style={{ width: 80, height: 80, '--progress': `${completionPercent}%` } as any}>
                    <div className={styles.innerCircle} style={{ width: 70, height: 70 }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>{completionPercent}%</span>
                    </div>
                </div>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{completedCount} / {totalHabits}</h2>
                    <p style={{ margin: 0, color: '#A3A3A3' }}>Habits Completed Today</p>
                </div>
            </div>

            <div className={styles.threeColGrid}>
                <div className={styles.column}>
                    <div className={styles.sectionTitle}><Zap size={18} color="#FBBF24" /> Daily Tasks</div>
                    <div className={styles.habitList}>{dailyTasks.map(renderHabitCard)}</div>
                </div>
                <div className={styles.column}>
                    <div className={styles.sectionTitle}><Activity size={18} color="#60A5FA" /> Metrics</div>
                    <div className={styles.habitList}>{metrics.map(renderHabitCard)}</div>
                </div>
                <div className={styles.column}>
                    <div className={styles.sectionTitle}><Shield size={18} color="#F87171" /> Anti-Habits</div>
                    <div className={styles.habitList}>{antiHabits.map(renderHabitCard)}</div>
                </div>
            </div>

            <div style={{ marginTop: '4rem' }}>
                <div className={styles.header} style={{ marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem' }}>Analytics</h2>
                    <div className={styles.viewControls} style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className={`${styles.viewBtn} ${analyticsView === 'chart' ? styles.active : ''}`} onClick={() => setAnalyticsView('chart')}><BarChart2 size={16} /> Charts</button>
                        <button className={`${styles.viewBtn} ${analyticsView === 'heatmap' ? styles.active : ''}`} onClick={() => setAnalyticsView('heatmap')}><Grid size={16} /> Heatmap</button>
                        <button className={`${styles.viewBtn} ${analyticsView === 'annual' ? styles.active : ''}`} onClick={() => setAnalyticsView('annual')}><Calendar size={16} /> Annual</button>
                    </div>
                </div>
                {analyticsView === 'chart' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {habits.map(habit => (
                            <div key={habit.id} className={styles.chartCard}>
                                <div className={styles.chartHeader}>
                                    <span className={styles.chartTitle}>{habit.name}</span>
                                    {habit.type === 'metric' && <span style={{ fontSize: '0.8rem', color: '#10B981' }}>Goal: {habit.targetValue}</span>}
                                </div>
                                <div style={{ height: 100, display: 'flex', alignItems: 'flex-end', gap: 4, opacity: 0.8 }}>
                                    {Array.from({ length: 30 }).map((_, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                flex: 1,
                                                height: `${habit.type === 'metric' ? Math.random() * 80 + 10 : (Math.random() > 0.3 ? 100 : 15)}%`,
                                                background: habit.type === 'anti-habit' ? '#F87171' : habit.type === 'metric' ? '#60A5FA' : '#10B981',
                                                borderRadius: 2
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {analyticsView === 'heatmap' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        {habits.map(habit => (
                            <div key={habit.id} className={styles.chartCard}>
                                <div style={{ marginBottom: 10 }}>{habit.name}</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 2 }}>
                                    {Array.from({ length: 50 }).map((_, i) => (
                                        <div key={i} style={{ width: '100%', aspectRatio: '1', background: Math.random() > 0.3 ? (habit.type === 'anti-habit' ? '#EF4444' : '#10B981') : '#262626', borderRadius: 2 }} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {analyticsView === 'annual' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {habits.map(habit => (
                            <div key={habit.id}>
                                <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>{habit.name}</h3>
                                <div style={{ display: 'flex', gap: 2, overflowX: 'auto', paddingBottom: 10 }}>
                                    {Array.from({ length: 52 }).map((_, w) => (
                                        <div key={w} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            {Array.from({ length: 7 }).map((_, d) => (
                                                <div key={d} style={{ width: 10, height: 10, background: Math.random() > 0.5 ? '#10B981' : '#262626', borderRadius: 1 }} />
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* --- SINGLE STEP MODAL --- */}
            {showWizard && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2>{editingHabitId ? 'Edit Habit' : 'Add New Habit'}</h2>
                            <button className={styles.iconBtn} onClick={() => setShowWizard(false)}><X size={20} /></button>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Habit Name</label>
                            <input
                                id="habitNameInput"
                                type="text"
                                className={styles.input}
                                placeholder="Name..."
                                value={habitForm.name || ''}
                                onChange={(e) => {
                                    setHabitForm({ ...habitForm, name: e.target.value });
                                    e.target.style.borderColor = '#404040'; // Reset error
                                }}
                                autoFocus
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Type</label>
                            <div className={styles.radioGroup}>
                                <div className={`${styles.radioLabel} ${habitForm.type === 'daily-task' ? styles.selected : ''}`} onClick={() => setHabitForm({ ...habitForm, type: 'daily-task' })}><Zap size={16} /> Task</div>
                                <div className={`${styles.radioLabel} ${habitForm.type === 'metric' ? styles.selected : ''}`} onClick={() => setHabitForm({ ...habitForm, type: 'metric' })}><Activity size={16} /> Metric</div>
                                <div className={`${styles.radioLabel} ${habitForm.type === 'anti-habit' ? styles.selected : ''}`} onClick={() => setHabitForm({ ...habitForm, type: 'anti-habit' })}><Shield size={16} /> Anti</div>
                            </div>
                        </div>

                        {habitForm.type === 'metric' && (
                            <div className={styles.formGroup} style={{ display: 'flex', gap: 10 }}>
                                <div style={{ flex: 1 }}>
                                    <label className={styles.label}>Target</label>
                                    <input type="number" className={styles.input} placeholder="2.5" value={habitForm.targetValue || ''} onChange={(e) => setHabitForm({ ...habitForm, targetValue: parseFloat(e.target.value) })} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label className={styles.label}>Unit</label>
                                    <input type="text" className={styles.input} placeholder="Liters" value={habitForm.unit || ''} onChange={(e) => setHabitForm({ ...habitForm, unit: e.target.value })} />
                                </div>
                            </div>
                        )}

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Category</label>
                            <select className={styles.select} value={habitForm.category} onChange={(e) => setHabitForm({ ...habitForm, category: e.target.value as Category })}>
                                <option value="Health">Health</option>
                                <option value="Work">Work</option>
                                <option value="Learning">Learning</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Streak Reset Buffer (Days)</label>
                            <input type="number" className={styles.input} value={habitForm.streakResetGap} onChange={(e) => setHabitForm({ ...habitForm, streakResetGap: parseInt(e.target.value) })} />
                        </div>

                        <div className={styles.modalActions}>
                            <button className={styles.btnSecondary} onClick={() => setShowWizard(false)}>Cancel</button>
                            <button className={styles.btnPrimary} onClick={saveHabit}>Save Habit</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- NOTE MODAL --- */}
            {noteModalHabitId && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal} style={{ maxWidth: 400 }}>
                        <div className={styles.modalHeader}>
                            <h2>Daily Note</h2>
                            <button className={styles.iconBtn} onClick={() => setNoteModalHabitId(null)}><X size={20} /></button>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                {habits.find(h => h.id === noteModalHabitId)?.name}
                            </label>
                            <textarea
                                className={styles.input}
                                rows={5}
                                placeholder="Details..."
                                value={currentNote}
                                onChange={(e) => setCurrentNote(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className={styles.modalActions}>
                            <button className={styles.btnPrimary} onClick={saveNote}>Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
