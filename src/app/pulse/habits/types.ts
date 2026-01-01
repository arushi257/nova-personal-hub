export type HabitType = 'daily-task' | 'metric' | 'anti-habit';
export type Category = 'Health' | 'Work' | 'Learning' | 'Home' | 'Other';

export interface Habit {
    id: string;
    name: string;
    type: HabitType;
    category: Category;

    // Goal & Frequency
    frequencyPerWeek: number; // For task/anti: How many times per week? (default 7)
    targetValue?: number; // For metric: Goal value per day
    unit?: string; // For metric: e.g. 'liters', 'pages'

    // Configuration
    streakResetGap: number; // Days allowed to miss before streak resets (default 1)
    requireNote: boolean;
    isPaused: boolean;
    initialValue?: number; // For metric baseline if needed

    // Runtime State (Computed or persisted)
    currentStreak: number;
    longestStreak: number;
    totalCompletions: number;
}

export interface DailyLog {
    id: string; // unique ID for the log entry
    habitId: string;
    date: string; // ISO date string YYYY-MM-DD
    completed: boolean; // For task/anti
    value?: number; // For metric
    note?: string;
    timestamp: number;
}
