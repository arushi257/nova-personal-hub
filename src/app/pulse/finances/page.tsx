'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import {
    Plus, CreditCard, Calendar, ArrowRight, TrendingUp, AlertCircle, Minus, Settings
} from 'lucide-react';
import {
    initialExpenses, budgets as initialBudgets, categories as initialCategories, subscriptions as initialSubscriptions, chartData
} from './data';
import { Expense, Category, PaymentMode, Subscription } from './types';
import { X } from 'lucide-react';

// Helper to format currency
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
};

export default function FinancePage() {
    const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
    const [chartMode, setChartMode] = useState<'Line' | 'Area' | 'Pie'>('Line');
    const [showAddModal, setShowAddModal] = useState(false);
    const [manageModalTab, setManageModalTab] = useState<'budgets' | 'categories' | 'subs' | null>(null);
    const [showBalanceModal, setShowBalanceModal] = useState(false);
    const [showAllHistory, setShowAllHistory] = useState(false);

    // Data State (Enable Edits)
    const [budgets, setBudgets] = useState(initialBudgets);
    const [categories, setCategories] = useState(initialCategories);
    const [subscriptions, setSubscriptions] = useState(initialSubscriptions);

    // New States
    const [activeMonth, setActiveMonth] = useState('2025-12');
    const systemMonth = '2025-12'; // Base reference month
    const isHistory = activeMonth < systemMonth;
    const isFuture = activeMonth > systemMonth;
    const isReadOnly = isHistory;

    const [activeCategory, setActiveCategory] = useState<string | 'All'>('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const initialBalance = 150000;
    const [balance, setBalance] = useState(() => {
        const spentSoFar = initialExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        return initialBalance - spentSoFar;
    }); // Starting balance

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Month Range Generation
    const getMonthOptions = () => {
        const options = [];
        const start = new Date(2025, 9); // Oct 2025 as first recorded
        const end = new Date(2026, 0); // Jan 2026 as 1 future month

        let current = new Date(start);
        while (current <= end) {
            const val = current.toISOString().substring(0, 7);
            const label = current.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            options.push({ value: val, label });
            current.setMonth(current.getMonth() + 1);
        }
        return options.reverse();
    };

    const handleMonthChange = (val: string) => {
        setIsRefreshing(true);
        setActiveMonth(val);
        setTimeout(() => setIsRefreshing(false), 400); // Mock skeleton delay
    };

    const handleAddExpense = (newExpense: Omit<Expense, 'id' | 'monthYear'>) => {
        if (isReadOnly) return; // Prevent adds in history
        if (!newExpense.date) {
            alert('Please select a date for the expense.');
            return;
        }
        if (!newExpense.amount || newExpense.amount <= 0) {
            alert('Amount must be greater than 0.');
            return;
        }
        const expense: Expense = {
            ...newExpense,
            id: Date.now().toString(),
            monthYear: newExpense.date.substring(0, 7) // YYYY-MM
        };
        setExpenses(prev => [expense, ...prev]);
        setShowAddModal(false);
        setBalance(prev => prev - newExpense.amount);
    };

    // Derived State: Month Filtering
    const monthlyExpenses = expenses.filter(e => e.monthYear === activeMonth);
    const totalSpent = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
    const budgetTotal = budgets.reduce((sum, b) => sum + b.limit, 0);
    // Balance is now managed as state and can be manually adjusted

    // Derived State: Spend by Category
    const categorySpend = monthlyExpenses.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
        return acc;
    }, {} as Record<string, number>);

    // Dynamic Next Bill
    const nextActiveBill = subscriptions
        .filter(s => s.active)
        .sort((a, b) => a.nextDate.localeCompare(b.nextDate))[0];

    if (!isMounted) return null; // Prevent hydration mismatch

    // Helper: Reassign expenses from one category to another (Archive logic)
    const reassignExpenses = (oldCatId: string, newCatId: string) => {
        setExpenses(prev => prev.map(e => e.category === oldCatId ? { ...e, category: newCatId } : e));
    };



    // Helper: Fluid Color Logic
    const getBudgetColor = (limit: number, spent: number) => {
        const pct = (spent / limit) * 100;

        if (pct > 100) return '#8B008B'; // Deep Magenta
        if (pct > 70) return '#FF4444'; // Red
        if (pct > 30) return '#FFAA00'; // Amber
        return '#00CC66'; // Green
    };

    // Helper: Time Ago
    const timeAgo = (dateStr: string) => {
        const diff = new Date().getTime() - new Date(dateStr).getTime();
        const days = Math.floor(diff / (1000 * 3600 * 24));
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 30) return `${days} days ago`;
        return dateStr;
    };

    // Filtered Feed
    const filteredFeed = expenses.filter(e => {
        const matchMonth = e.monthYear === activeMonth;
        const matchCat = activeCategory === 'All' || e.category === activeCategory;
        const matchSearch = e.note.toLowerCase().includes(searchTerm.toLowerCase());
        return matchMonth && matchCat && matchSearch;
    });

    const handleCategoryClick = (id: string | 'All') => {
        setActiveCategory(prev => prev === id ? 'All' : id);
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <div>
                        <h1 className={styles.title}>Finance</h1>
                        <div className={styles.subtext}>Calm Financial Mirror</div>
                    </div>
                    {/* Month Selector */}
                    <div className={styles.monthSelector}>
                        <Calendar size={16} color="#666" />
                        <select
                            value={activeMonth}
                            onChange={e => handleMonthChange(e.target.value)}
                            className={styles.monthSelectDropdown}
                        >
                            {getMonthOptions().map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label} ▾</option>
                            ))}
                        </select>
                    </div>
                </div>
                {!isReadOnly && (
                    <button className={styles.actionButton} onClick={() => setShowAddModal(true)}>
                        <Plus size={18} /> Add Expense
                    </button>
                )}
            </header>

            <main className={styles.mainContent}>

                {/* 1. Summary Strip */}
                <section className={styles.summaryStrip}>
                    <SummaryCard
                        label="Net Balance"
                        value={formatCurrency(balance)}
                        sub="Available Cash"
                        onClick={() => setShowBalanceModal(true)}
                        clickable
                    />
                    <SummaryCard label="This Month" value={formatCurrency(totalSpent)} sub={`${budgetTotal > 0 ? Math.round((totalSpent / budgetTotal) * 100) : 0}% of budget`} highlight />
                    <SummaryCard label="Remaining" value={formatCurrency(budgetTotal - totalSpent)} sub="Safe to spend" />
                    <SummaryCard
                        label="Next Bill"
                        value={nextActiveBill?.name || 'None'}
                        sub={nextActiveBill ? `${new Date(nextActiveBill.nextDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • ${formatCurrency(nextActiveBill.amount)}` : 'No active bills'}
                        onClick={() => document.getElementById('subscriptions-section')?.scrollIntoView({ behavior: 'smooth' })}
                        clickable
                    />
                </section>

                {/* 2. Monthly Expense Chart */}
                <section className={styles.breakdownSection}>
                    <div className={styles.sectionTitle}>
                        <span>Details</span>
                        <span style={{ fontSize: '0.9rem', color: '#666' }}>{activeMonth}</span>
                    </div>
                    <div className={styles.breakdownStrip}>
                        {categories.filter(c => !c.archived).map(cat => {
                            const spent = categorySpend[cat.id] || 0;
                            if (spent === 0) return null;
                            const pct = (spent / totalSpent) * 100;
                            const isDimmed = activeCategory !== 'All' && activeCategory !== cat.id;
                            return (
                                <div
                                    key={cat.id}
                                    className={styles.breakdownSegment}
                                    style={{
                                        width: `${pct}%`,
                                        background: cat.color,
                                        opacity: isDimmed ? 0.2 : 1,
                                        transform: isDimmed ? 'scaleY(0.8)' : 'scaleY(1)',
                                        transition: 'all 0.3s ease'
                                    }}
                                />
                            );
                        })}
                    </div>
                    <div className={styles.categoryChips}>
                        {categories.filter(c => !c.archived).map(cat => {
                            const spent = categorySpend[cat.id] || 0;
                            const pct = totalSpent > 0 ? (spent / totalSpent) * 100 : 0;
                            const isSelected = activeCategory === cat.id;
                            return (
                                <div
                                    key={cat.id}
                                    className={`${styles.chip} ${isSelected ? styles.chipSelected : ''}`}
                                    onClick={() => handleCategoryClick(cat.id)}
                                    style={isSelected ? { borderColor: cat.color, background: `${cat.color}15` } : {}}
                                >
                                    <div className={styles.chipDot} style={{ background: cat.color }} />
                                    <span>{cat.name}</span>
                                    <span style={{ opacity: 0.5, marginLeft: '4px' }}>
                                        {formatCurrency(spent)} ({Math.round(pct)}%)
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* 3. Budget System */}
                <section className={styles.budgetGrid}>
                    <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Budgets</h2>
                        {!isReadOnly && (
                            <button
                                style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}
                                onClick={() => setManageModalTab('budgets')}
                            >
                                <Settings size={14} /> Manage Categories
                            </button>
                        )}
                    </div>

                    {budgets.filter(b => {
                        const cat = categories.find(c => c.id === b.categoryId);
                        return cat && !cat.archived;
                    }).map(b => {
                        const cat = categories.find(c => c.id === b.categoryId);
                        const spent = categorySpend[b.categoryId] || 0;
                        const pct = (spent / b.limit) * 100;
                        const color = getBudgetColor(b.limit, spent);
                        const isSelected = activeCategory === b.categoryId;

                        // Capped pct for internal bar, but text shows real numbers
                        const fillPct = Math.min(pct, 100);
                        const isOver = spent > b.limit;

                        return (
                            <div
                                key={b.categoryId}
                                className={`${styles.budgetCard} ${isSelected ? styles.chipSelected : ''}`}
                                onClick={() => {
                                    handleCategoryClick(b.categoryId);
                                    document.getElementById('recent-feed')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                style={{
                                    cursor: 'pointer',
                                    borderColor: isSelected ? color : 'transparent',
                                    background: isSelected ? `${color}05` : 'var(--nova-card-bg)'
                                }}
                            >
                                <div className={styles.budgetHeader}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ fontSize: '1.2rem' }}>{cat?.icon}</div>
                                        <strong>{cat?.name}</strong>
                                    </div>
                                    <div className={styles.budgetInfo}>
                                        {formatCurrency(spent)} / {formatCurrency(b.limit)}
                                    </div>
                                </div>
                                <div className={styles.progressBarContainer}>
                                    <div
                                        className={styles.progressBar}
                                        style={{ width: `${fillPct}%`, background: color }}
                                    />
                                    {isOver && <div className={styles.overBudgetStripe} style={{ boxShadow: `0 0 5px ${color}`, background: color }} />}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.8rem' }}>
                                    <span style={{ color: color }}>{pct > 100 ? 'Over Limit' : pct > 70 ? 'Critical' : pct > 30 ? 'Warning' : 'Good'}</span>
                                    <span style={{ color: '#666' }}>
                                        {isOver
                                            ? <span style={{ color: color }}>{formatCurrency(spent - b.limit)} over</span>
                                            : `${formatCurrency(b.limit - spent)} left`
                                        }
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </section>

                {/* 4. Expense Feed (Upgraded) */}
                <section id="recent-feed" className={styles.feedSection}>
                    <div className={styles.sectionTitle}>
                        Recent Transactions
                    </div>

                    {/* Inline Filters */}
                    <div className={styles.feedControls}>
                        <div className={styles.inlineFilters}>
                            <button
                                className={`${styles.filterPill} ${activeCategory === 'All' ? styles.active : ''}`}
                                onClick={() => handleCategoryClick('All')}
                            >
                                All
                            </button>
                            {categories.filter(c => !c.archived).map(cat => (
                                <button
                                    key={cat.id}
                                    className={`${styles.filterPill} ${activeCategory === cat.id ? styles.active : ''}`}
                                    onClick={() => handleCategoryClick(cat.id)}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                        <input
                            type="text"
                            placeholder="Search notes..."
                            className={styles.searchInput}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Active Filter Pill */}
                    {activeCategory !== 'All' && (
                        <div className={styles.activeFilterContainer}>
                            <div className={styles.activeFilterPill} onClick={() => handleCategoryClick('All')}>
                                Filter: {categories.find(c => c.id === activeCategory)?.name} <span>×</span>
                            </div>
                        </div>
                    )}

                    <div className={`${styles.feedList} ${isRefreshing ? styles.refreshing : ''}`}>
                        {filteredFeed.slice(0, showAllHistory ? undefined : 5).map(expense => {
                            const cat = categories.find(c => c.id === expense.category);
                            if (cat?.archived && activeCategory === 'All') return null; // Hide archived by default in feed
                            return (
                                <div key={expense.id} className={styles.expenseRow}>
                                    <div className={styles.expenseCat}>
                                        <div style={{
                                            width: '32px', height: '32px',
                                            borderRadius: '50%', background: 'rgba(255,255,255,0.1)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            {cat?.icon}
                                        </div>
                                        <div>
                                            <div>{cat?.name}</div>
                                            <div className={styles.expenseNote}>{expense.note}</div>
                                        </div>
                                    </div>
                                    <div style={{ color: '#888', fontSize: '0.9rem' }}>{timeAgo(expense.date)}</div>
                                    <div style={{ color: '#888', fontSize: '0.9rem' }}>{expense.mode}</div>
                                    <div className={styles.expenseAmount}>
                                        - {formatCurrency(expense.amount)}
                                    </div>

                                    {/* Hover Actions */}
                                    <div className={styles.rowActions}>
                                        <button title="Edit">✎</button>
                                        <button title="Delete" style={{ color: '#FF4444' }}>×</button>
                                    </div>
                                </div>
                            );
                        })}
                        {filteredFeed.length === 0 && <div style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>No expenses found</div>}
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                        {filteredFeed.length > 5 && (
                            <button
                                style={{ background: 'none', border: 'none', color: '#00E5FF', cursor: 'pointer', fontWeight: 600 }}
                                onClick={() => setShowAllHistory(!showAllHistory)}
                            >
                                {showAllHistory ? 'View Less' : 'View Full History'}
                            </button>
                        )}
                    </div>
                </section>

                {/* 5. Analytics (Charts) */}
                <section className={styles.chartsSection}>
                    {/* ... Charts content (unchanged logic mostly) ... */}
                    <div className={styles.sectionTitle}>
                        Analytics
                        <div>
                            {(['Line', 'Area', 'Pie'] as const).map(m => (
                                <button
                                    key={m}
                                    className={`${styles.chartToggle} ${chartMode === m ? styles.active : ''}`}
                                    onClick={() => setChartMode(m)}
                                >
                                    {m} Chart
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className={styles.chartContainer}>
                        <ResponsiveContainer width="100%" height="100%">
                            {chartMode === 'Line' ? (
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                    <XAxis dataKey="name" stroke="#666" />
                                    <YAxis stroke="#666" />
                                    <Tooltip contentStyle={{ background: '#1A1A1C', border: '1px solid #333' }} itemStyle={{ color: '#fff' }} />
                                    <Line type="monotone" dataKey="total" stroke="#00E5FF" strokeWidth={2} dot={{ r: 4 }} />
                                    <Line type="monotone" dataKey="budget" stroke="#FF6D00" strokeDasharray="5 5" />
                                </LineChart>
                            ) : chartMode === 'Area' ? (
                                <AreaChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                    <XAxis dataKey="name" stroke="#666" />
                                    <YAxis stroke="#666" />
                                    <Tooltip contentStyle={{ background: '#1A1A1C', border: '1px solid #333' }} itemStyle={{ color: '#fff' }} />
                                    {categories.filter(c => !c.archived).map(cat => (
                                        <Area key={cat.id} type="monotone" dataKey={cat.name} stackId="1" stroke={cat.color} fill={cat.color} fillOpacity={0.6} />
                                    ))}
                                </AreaChart>
                            ) : (
                                <PieChart>
                                    <Pie
                                        data={Object.entries(categorySpend).filter(([k]) => !categories.find(c => c.id === k)?.archived).map(([k, v]) => ({
                                            name: categories.find(c => c.id === k)?.name || k,
                                            value: v
                                        }))}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                    >
                                        {Object.entries(categorySpend).map(([k, v], index) => {
                                            const cat = categories.find(c => c.id === k);
                                            return <Cell key={`cell-${index}`} fill={cat?.color || '#888'} />;
                                        })}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: '#1A1A1C', border: '1px solid #333' }} />
                                </PieChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                </section>

                {/* 6. Subscriptions */}
                <section id="subscriptions-section" className={styles.feedSection} style={{ marginBottom: '4rem' }}>
                    <div className={styles.sectionTitle}>
                        Recurring Subscriptions
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ fontSize: '0.9rem', color: '#666' }}>
                                Total: {formatCurrency(subscriptions.filter(s => s.active && !s.archived).reduce((sum, s) => sum + s.amount, 0))}/mo
                            </span>
                            {!isReadOnly && (
                                <button
                                    style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}
                                    onClick={() => setManageModalTab('subs')}
                                >
                                    <Settings size={14} /> Manage
                                </button>
                            )}
                        </div>
                    </div>
                    <div className={styles.feedList}>
                        {subscriptions.filter(s => !s.archived).map(sub => (
                            <div key={sub.id} className={styles.expenseRow} style={{ opacity: sub.active ? 1 : 0.5 }}>
                                <div className={styles.expenseCat}>
                                    <div style={{
                                        width: '32px', height: '32px',
                                        borderRadius: '50%', background: 'rgba(0,229,255,0.1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <ArrowRight size={14} color="#00E5FF" />
                                    </div>
                                    <div>
                                        <div>{sub.name}</div>
                                        <div className={styles.expenseNote}>{sub.billingCycle} • Next: {sub.nextDate}</div>
                                    </div>
                                </div>
                                <div></div>
                                <div style={{ color: sub.active ? '#00CC66' : '#888' }}>{sub.active ? 'Active' : 'Paused'}</div>
                                <div className={styles.expenseAmount}>
                                    {formatCurrency(sub.amount)}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Add Expense Modal */}
                {showAddModal && (
                    <AddExpenseModal
                        onClose={() => setShowAddModal(false)}
                        onSubmit={handleAddExpense}
                        categories={categories.filter(c => !c.archived)}
                    />
                )}

                {/* Manage Finance Modal */}
                {manageModalTab && (
                    <ManageModal
                        onClose={() => setManageModalTab(null)}
                        defaultTab={manageModalTab}
                        onSave={(newBudgets, newCats, newSubs) => {
                            setBudgets(newBudgets);
                            setCategories(newCats);
                            setSubscriptions(newSubs);
                        }}
                        onReassign={reassignExpenses}
                        categories={categories}
                        budgets={budgets}
                        subscriptions={subscriptions}
                        expenses={expenses}
                    />
                )}

                {/* Balance Adjustment Modal */}
                {showBalanceModal && (
                    <BalanceAdjustmentModal
                        onClose={() => setShowBalanceModal(false)}
                        currentBalance={balance}
                        onAdjust={(amount, type) => {
                            if (type === 'add') {
                                setBalance(balance + amount);
                            } else {
                                setBalance(balance - amount);
                            }
                            setShowBalanceModal(false);
                        }}
                    />
                )}

            </main>
        </div>
    );
}

function AddExpenseModal({ onClose, onSubmit, categories }: {
    onClose: () => void,
    onSubmit: (e: any) => void,
    categories: Category[]
}) {
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState(categories[0]?.id || 'food');
    const [note, setNote] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [mode, setMode] = useState<PaymentMode>('UPI');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            amount: Number(amount),
            category,
            note,
            date,
            mode,
            recurring: false
        });
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 className={styles.modalTitle} style={{ margin: 0 }}>Add Expense</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer' }}><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Amount</label>
                        <input
                            type="number"
                            className={styles.formInput}
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            required
                            autoFocus
                            placeholder="₹0"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Category</label>
                        <select
                            className={styles.formSelect}
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                        >
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Note</label>
                        <input
                            type="text"
                            className={styles.formInput}
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="Lunch, taxi, etc."
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Date</label>
                            <input
                                type="date"
                                className={styles.formInput}
                                value={date}
                                onChange={e => setDate(e.target.value)}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Mode</label>
                            <select
                                className={styles.formSelect}
                                value={mode}
                                onChange={e => setMode(e.target.value as PaymentMode)}
                            >
                                <option value="UPI">UPI</option>
                                <option value="Card">Card</option>
                                <option value="Cash">Cash</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.modalActions}>
                        <button type="button" className={styles.cancelButton} onClick={onClose}>Cancel</button>
                        <button type="submit" className={styles.submitButton}>Add Expense</button>
                    </div>
                </form>
            </div>
        </div>
    );
}



function ManageModal({
    onClose, onSave, onReassign,
    categories, budgets, subscriptions, expenses, defaultTab
}: {
    onClose: () => void;
    onSave: (b: any[], c: any[], s: any[]) => void;
    onReassign: (oldId: string, newId: string) => void;
    categories: Category[];
    budgets: any[];
    subscriptions: Subscription[];
    expenses: Expense[];
    defaultTab?: 'budgets' | 'categories' | 'subs';
}) {
    const [activeTab, setActiveTab] = useState<'budgets' | 'categories' | 'subs'>(defaultTab || 'budgets');
    const [localBudgets, setLocalBudgets] = useState(budgets);
    const [localCats, setLocalCats] = useState(categories);
    const [localSubs, setLocalSubs] = useState(subscriptions);

    const canDeleteCategory = (id: string) => {
        return !expenses.some(e => e.category === id);
    };

    const handleAutoAllocate = () => {
        const months = chartData.length;
        const newBudgets = localBudgets.map(b => {
            const cat = localCats.find(c => c.id === b.categoryId);
            if (!cat) return b;
            const totalPastSpend = chartData.reduce((sum, monthData) => {
                const val = (monthData as any)[cat.name] || 0;
                return sum + val;
            }, 0);
            const avg = totalPastSpend / months;
            return { ...b, limit: Math.round(avg * 1.1 / 100) * 100 };
        });
        setLocalBudgets(newBudgets);
    };

    const handleAddCategory = () => {
        const newId = 'new_' + Date.now();
        const newCat: Category = { id: newId, name: 'New Category', icon: '📁', color: '#888888', archived: false };
        setLocalCats([...localCats, newCat]);
        setLocalBudgets([...localBudgets, { categoryId: newId, limit: 1000, spent: 0 }]);
    };

    const handleDeleteCategory = (id: string) => {
        if (!canDeleteCategory(id)) {
            // Archive category with expenses - keep budget entry for restoration
            setLocalCats(localCats.map(c => c.id === id ? { ...c, archived: true } : c));
            return;
        }
        // Delete category without expenses
        setLocalCats(localCats.filter(c => c.id !== id));
        setLocalBudgets(localBudgets.filter(b => b.categoryId !== id));
    };

    const handleSave = () => {
        // Unique name check
        const names = localCats.filter(c => !c.archived).map(c => c.name.toLowerCase());
        const hasDupes = names.some((n, i) => names.indexOf(n) !== i);
        if (hasDupes) {
            alert("Category names must be unique.");
            return;
        }
        onSave(localBudgets, localCats, localSubs);
        onClose();
    };

    // Archive Vault state and handlers
    const [showVault, setShowVault] = useState(false);

    const handleUnarchiveCategory = (id: string) => {
        // Simply unarchive - budget entry was preserved
        setLocalCats(localCats.map(c => c.id === id ? { ...c, archived: false } : c));
    };

    const handleUnarchiveSubscription = (id: string) => {
        setLocalSubs(localSubs.map(s => s.id === id ? { ...s, archived: false } : s));
    };

    const handlePermanentDeleteCategory = (id: string) => {
        setLocalCats(localCats.filter(c => c.id !== id));
        setLocalBudgets(localBudgets.filter(b => b.categoryId !== id));
    };

    const handlePermanentDeleteSubscription = (id: string) => {
        setLocalSubs(localSubs.filter(s => s.id !== id));
    };

    const handleArchiveBudget = (categoryId: string) => {
        // Archive the category associated with this budget - keep budget entry for restoration
        setLocalCats(localCats.map(c => c.id === categoryId ? { ...c, archived: true } : c));
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} style={{ maxWidth: '600px', height: '80vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 className={styles.modalTitle} style={{ margin: 0 }}>Manage Finance</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer' }}><X size={24} /></button>
                </div>

                <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #333', marginBottom: '1.5rem' }}>
                    {(['budgets', 'categories', 'subs'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                background: 'none', border: 'none', padding: '0.5rem 0',
                                color: activeTab === tab ? '#00E5FF' : '#888',
                                borderBottom: activeTab === tab ? '2px solid #00E5FF' : '2px solid transparent',
                                cursor: 'pointer', fontSize: '1rem', textTransform: 'capitalize'
                            }}
                        >
                            {tab === 'subs' ? 'Subscriptions' : tab}
                        </button>
                    ))}
                </div>

                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
                    {activeTab === 'budgets' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <p style={{ color: '#888', fontSize: '0.9rem' }}>Set monthly limits for each category.</p>
                                <button onClick={handleAutoAllocate} style={{ background: 'rgba(0,229,255,0.1)', color: '#00E5FF', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                                    ✨ Auto-Allocate
                                </button>
                            </div>
                            {localBudgets.map((b, idx) => {
                                const cat = localCats.find(c => c.id === b.categoryId);
                                if (!cat || cat.archived) return null; // Hide archived categories
                                return (
                                    <div key={b.categoryId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px' }}>
                                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flex: 1 }}>
                                            <div style={{ fontSize: '1.2rem' }}>{cat.icon}</div>
                                            <div>{cat.name}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <input
                                                type="number"
                                                value={b.limit}
                                                onChange={(e) => {
                                                    const newB = [...localBudgets];
                                                    newB[idx].limit = Number(e.target.value);
                                                    setLocalBudgets(newB);
                                                }}
                                                className={styles.formInput}
                                                style={{ width: '100px', padding: '0.4rem' }}
                                            />
                                            <button
                                                onClick={() => handleArchiveBudget(b.categoryId)}
                                                style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', padding: '4px' }}
                                                title="Archive Budget & Category"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'categories' && (
                        <div>
                            <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1rem' }}>Customize your categories.</p>
                            {localCats.filter(c => !c.archived).map((cat) => {
                                const idx = localCats.findIndex(lc => lc.id === cat.id);
                                return (
                                    <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                        <input
                                            value={cat.icon}
                                            onChange={(e) => {
                                                const newC = [...localCats];
                                                newC[idx].icon = e.target.value;
                                                setLocalCats(newC);
                                            }}
                                            style={{ background: '#333', border: 'none', color: 'white', padding: '4px', borderRadius: '4px', width: '32px', textAlign: 'center' }}
                                        />
                                        <input
                                            value={cat.name}
                                            onChange={(e) => {
                                                const newC = [...localCats];
                                                newC[idx].name = e.target.value;
                                                setLocalCats(newC);
                                            }}
                                            className={styles.formInput}
                                            style={{ padding: '0.3rem', flex: 1 }}
                                        />
                                        <input
                                            type="color"
                                            value={cat.color}
                                            onChange={(e) => {
                                                const newC = [...localCats];
                                                newC[idx].color = e.target.value;
                                                setLocalCats(newC);
                                            }}
                                            style={{ background: 'none', border: 'none', width: '30px', height: '30px', cursor: 'pointer' }}
                                        />
                                        <button
                                            onClick={() => handleDeleteCategory(cat.id)}
                                            style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', padding: '4px' }}
                                            title={canDeleteCategory(cat.id) ? "Delete" : "Archive (Has expenses)"}
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                );
                            })}
                            <button onClick={handleAddCategory} style={{ width: '100%', padding: '0.75rem', border: '1px dashed #333', background: 'transparent', color: '#888', borderRadius: '8px', cursor: 'pointer', marginTop: '1rem' }}>
                                + Add New Category
                            </button>
                        </div>
                    )}

                    {activeTab === 'subs' && (
                        <div>
                            <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1rem' }}>Manage recurring payments.</p>
                            {localSubs.filter(s => !s.archived).map((sub) => {
                                const idx = localSubs.findIndex(ls => ls.id === sub.id);
                                return (
                                    <div key={sub.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', opacity: sub.active ? 1 : 0.5 }}>
                                        <div style={{ flex: 1, display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                                            <input
                                                value={sub.name}
                                                onChange={(e) => {
                                                    const newS = [...localSubs];
                                                    newS[idx].name = e.target.value;
                                                    setLocalSubs(newS);
                                                }}
                                                className={styles.formInput}
                                                style={{ padding: '0.2rem', background: 'transparent', border: 'none', fontWeight: 600 }}
                                            />
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <input
                                                    type="number"
                                                    value={sub.amount}
                                                    onChange={(e) => {
                                                        const newS = [...localSubs];
                                                        newS[idx].amount = Number(e.target.value);
                                                        setLocalSubs(newS);
                                                    }}
                                                    className={styles.formInput}
                                                    style={{ width: '80px', padding: '0.2rem' }}
                                                />
                                                <select
                                                    value={sub.billingCycle}
                                                    onChange={(e) => {
                                                        const newS = [...localSubs];
                                                        newS[idx].billingCycle = e.target.value as any;
                                                        setLocalSubs(newS);
                                                    }}
                                                    className={styles.formSelect}
                                                    style={{ width: '100px', padding: '0.2rem' }}
                                                >
                                                    <option value="Monthly">Monthly</option>
                                                    <option value="Yearly">Yearly</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <button
                                                onClick={() => {
                                                    const newS = [...localSubs];
                                                    newS[idx].active = !newS[idx].active;
                                                    setLocalSubs(newS);
                                                }}
                                                style={{ background: sub.active ? '#00CC66' : '#333', color: 'black', border: 'none', padding: '0.3rem 0.8rem', borderRadius: '12px', cursor: 'pointer', fontSize: '0.8rem' }}
                                            >
                                                {sub.active ? 'Active' : 'Paused'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setLocalSubs(localSubs.map(s => s.id === sub.id ? { ...s, archived: true } : s));
                                                }}
                                                style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', padding: '4px' }}
                                                title="Archive Subscription"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                            <button
                                onClick={() => {
                                    const newSub = { id: Date.now().toString(), name: 'New Subscription', amount: 0, billingCycle: 'Monthly' as const, nextDate: '2026-01-01', active: true };
                                    setLocalSubs([...localSubs, newSub]);
                                }}
                                style={{ width: '100%', padding: '0.75rem', border: '1px dashed #333', background: 'transparent', color: '#888', borderRadius: '8px', cursor: 'pointer', marginTop: '1rem' }}
                            >
                                + Add New Subscription
                            </button>
                        </div>
                    )}
                </div>

                {/* Archive Vault Section */}
                <div style={{ borderTop: '1px solid #333', paddingTop: '1rem', marginTop: '1rem' }}>
                    <button
                        onClick={() => setShowVault(!showVault)}
                        style={{
                            width: '100%',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid #333',
                            color: '#888',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            fontSize: '0.9rem'
                        }}
                    >
                        <Settings size={14} /> {showVault ? 'Hide' : 'Show'} Archive Vault
                    </button>

                    {showVault && (
                        <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            {/* Archived Categories */}
                            <div>
                                <h4 style={{ color: '#888', fontSize: '0.9rem', marginBottom: '0.75rem' }}>Archived Categories</h4>
                                {localCats.filter(c => c.archived).map(cat => (
                                    <div key={cat.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '6px' }}>
                                        <span style={{ fontSize: '0.85rem' }}>{cat.icon} {cat.name}</span>
                                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                                            <button
                                                onClick={() => handleUnarchiveCategory(cat.id)}
                                                style={{ background: '#00CC66', color: 'black', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                                            >
                                                Restore
                                            </button>
                                            <button
                                                onClick={() => handlePermanentDeleteCategory(cat.id)}
                                                style={{ background: '#ff4444', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {localCats.filter(c => c.archived).length === 0 && (
                                    <p style={{ color: '#666', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>No archived categories</p>
                                )}
                            </div>

                            {/* Archived Subscriptions */}
                            <div>
                                <h4 style={{ color: '#888', fontSize: '0.9rem', marginBottom: '0.75rem' }}>Archived Subscriptions</h4>
                                {localSubs.filter(s => s.archived).map(sub => (
                                    <div key={sub.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '6px' }}>
                                        <span style={{ fontSize: '0.85rem' }}>{sub.name}</span>
                                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                                            <button
                                                onClick={() => handleUnarchiveSubscription(sub.id)}
                                                style={{ background: '#00CC66', color: 'black', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                                            >
                                                Restore
                                            </button>
                                            <button
                                                onClick={() => handlePermanentDeleteSubscription(sub.id)}
                                                style={{ background: '#ff4444', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {localSubs.filter(s => s.archived).length === 0 && (
                                    <p style={{ color: '#666', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>No archived subscriptions</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.modalActions}>
                    <button onClick={onClose} className={styles.cancelButton}>Close</button>
                    <button onClick={handleSave} className={styles.submitButton}>Save Changes</button>
                </div>
            </div>
        </div>
    );
}

function SummaryCard({ label, value, sub, highlight, onClick, clickable }: {
    label: string, value: string, sub: string, highlight?: boolean, onClick?: () => void, clickable?: boolean
}) {
    return (
        <div
            className={`${styles.summaryCard} ${clickable ? styles.clickableCard : ''}`}
            style={highlight ? { borderColor: 'var(--nova-cyan)', boxShadow: '0 0 20px rgba(0, 229, 255, 0.1)' } : {}}
            onClick={onClick}
        >
            <div className={styles.summaryLabel}>{label}</div>
            <div className={styles.summaryValue} style={highlight ? { color: 'var(--nova-cyan)' } : {}}>{value}</div>
            <div className={styles.valueSub}>{sub}</div>
        </div>
    );
}

function BalanceAdjustmentModal({ onClose, currentBalance, onAdjust }: {
    onClose: () => void;
    currentBalance: number;
    onAdjust: (amount: number, type: 'add' | 'deduct') => void;
}) {
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'add' | 'deduct'>('add');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = Number(amount);
        if (numAmount > 0) {
            onAdjust(numAmount, type);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 className={styles.modalTitle} style={{ margin: 0 }}>Adjust Balance</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer' }}><X size={24} /></button>
                </div>

                <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                    <div style={{ color: '#888', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Current Balance</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--nova-cyan)' }}>
                        ₹{currentBalance.toLocaleString()}
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label className={styles.formLabel}>Adjustment Type</label>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <button
                                type="button"
                                onClick={() => setType('add')}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    background: type === 'add' ? '#00CC66' : 'rgba(255,255,255,0.05)',
                                    color: type === 'add' ? 'black' : '#888',
                                    border: type === 'add' ? '2px solid #00CC66' : '1px solid #333',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: type === 'add' ? 'bold' : 'normal'
                                }}
                            >
                                + Add Money
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('deduct')}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    background: type === 'deduct' ? '#ff4444' : 'rgba(255,255,255,0.05)',
                                    color: type === 'deduct' ? 'white' : '#888',
                                    border: type === 'deduct' ? '2px solid #ff4444' : '1px solid #333',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: type === 'deduct' ? 'bold' : 'normal'
                                }}
                            >
                                - Deduct Money
                            </button>
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label className={styles.formLabel}>Amount</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            className={styles.formInput}
                            placeholder="Enter amount"
                            required
                            min="1"
                            step="1"
                        />
                    </div>

                    <div className={styles.modalActions}>
                        <button type="button" onClick={onClose} className={styles.cancelButton}>Cancel</button>
                        <button type="submit" className={styles.submitButton}>
                            {type === 'add' ? 'Add' : 'Deduct'} ₹{amount || '0'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
