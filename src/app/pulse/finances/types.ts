export type PaymentMode = 'Card' | 'UPI' | 'Cash';

export interface Expense {
    id: string;
    amount: number;
    category: string;
    date: string; // ISO Date YYYY-MM-DD
    note: string;
    mode: PaymentMode;
    recurring: boolean;
    // For indexing/charting
    monthYear: string; // YYYY-MM
}

export interface Budget {
    categoryId: string;
    limit: number;
    spent: number;
}

export interface Subscription {
    id: string;
    name: string;
    amount: number;
    billingCycle: 'Monthly' | 'Yearly';
    nextDate: string; // YYYY-MM-DD
    active: boolean;
    archived?: boolean;
}

export interface Category {
    id: string;
    name: string;
    color: string;
    icon: string; // Emoji
    archived?: boolean;
}

export interface MonthlyStats {
    month: string; // YYYY-MM
    totalSpend: number;
    categoryBreakdown: Record<string, number>; // categoryId -> amount
}
