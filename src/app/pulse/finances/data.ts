import { Budget, Category, Expense, Subscription } from './types';

export const categories: Category[] = [
    {
        id: 'food', name: 'Food', icon: '🍱',
        color: '#FF6D00',
        archived: false
    },
    {
        id: 'travel',
        name: 'Travel',
        icon: '✈️',
        color: '#00E5FF',
        archived: false
    },
    {
        id: 'subs',
        name: 'Subscriptions',
        icon: '💳',
        color: '#00CC66',
        archived: false
    },
    {
        id: 'fun',
        name: 'Fun',
        icon: '🎮',
        color: '#FF4444',
        archived: false
    },
    {
        id: 'drinks',
        name: 'Drinks',
        icon: '🍺',
        color: '#FFD700',
        archived: false
    },
    {
        id: 'decor',
        name: 'Room Decor',
        icon: '💡',
        color: '#9C27B0',
        archived: false
    },
    {
        id: 'shopping',
        name: 'Shopping',
        icon: '🛍️',
        color: '#E91E63',
        archived: false
    },
    { id: 'misc', name: 'Misc', icon: '📦', color: '#888888', archived: false }
];

export const budgets: Budget[] = [
    { categoryId: 'food', limit: 8000, spent: 5400 },
    { categoryId: 'travel', limit: 5000, spent: 1200 },
    { categoryId: 'subs', limit: 2000, spent: 999 },
    { categoryId: 'fun', limit: 4000, spent: 3800 }, // Warning!
    { categoryId: 'drinks', limit: 2000, spent: 0 },
    { categoryId: 'decor', limit: 3000, spent: 0 },
    { categoryId: 'shopping', limit: 5000, spent: 1500 }
];

export const subscriptions: Subscription[] = [
    {
        id: '1', name: 'Netflix', amount: 499, billingCycle: 'Monthly',
        nextDate: '2026-01-09',
        active: true,
        archived: false
    },
    {
        id: '2',
        name: 'Spotify',
        amount: 119,
        billingCycle: 'Monthly',
        nextDate: '2026-01-15',
        active: true,
        archived: false
    },
    {
        id: '3',
        name: 'Google One',
        amount: 130,
        billingCycle: 'Monthly',
        nextDate: '2026-01-20',
        active: true,
        archived: false
    },
    { id: '4', name: 'Vercel', amount: 2000, billingCycle: 'Monthly', nextDate: '2026-01-05', active: false, archived: false }
];

// Helper to generate some expenses
const generateExpenses = (): Expense[] => {
    // Current month expenses (Dec 2025 based on prompt context)
    return [
        { id: '1', amount: 450, category: 'food', date: '2025-12-19', note: 'Lunch with team', mode: 'UPI', recurring: false, monthYear: '2025-12' },
        { id: '2', amount: 1200, category: 'travel', date: '2025-12-18', note: 'Uber to airport', mode: 'Card', recurring: false, monthYear: '2025-12' },
        { id: '3', amount: 5000, category: 'shopping', date: '2025-12-15', note: 'Winter jacket', mode: 'Card', recurring: false, monthYear: '2025-12' },
        { id: '4', amount: 1200, category: 'food', date: '2025-12-14', note: 'Groceries', mode: 'UPI', recurring: false, monthYear: '2025-12' },
        { id: '5', amount: 499, category: 'subs', date: '2025-12-10', note: 'Netflix', mode: 'Card', recurring: true, monthYear: '2025-12' },
        { id: '6', amount: 3000, category: 'fun', date: '2025-12-08', note: 'Concert tickets', mode: 'Card', recurring: false, monthYear: '2025-12' },
        // Previous month (Nov 2025)
        { id: '7', amount: 800, category: 'food', date: '2025-11-20', note: 'Dinner date', mode: 'UPI', recurring: false, monthYear: '2025-11' },
    ];
};

export const initialExpenses = generateExpenses();

// Mock Charts Data (Aggregated)
export const chartData = [
    { name: 'Sep', total: 12000, Food: 5000, Travel: 2000, Subs: 1000, Fun: 3000, Shopping: 1000 },
    { name: 'Oct', total: 15000, Food: 5500, Travel: 3000, Subs: 1000, Fun: 2500, Shopping: 3000 },
    { name: 'Nov', total: 14000, Food: 5200, Travel: 2500, Subs: 1000, Fun: 4000, Shopping: 1300 },
    { name: 'Dec', total: 12899, Food: 6400, Travel: 1200, Subs: 999, Fun: 3800, Shopping: 500 }, // Current month partial
];
