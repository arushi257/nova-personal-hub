'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

export default function DateTime() {
    const [mounted, setMounted] = useState(false);
    const [date, setDate] = useState(new Date());

    useEffect(() => {
        setMounted(true);
        const timer = setInterval(() => setDate(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    if (!mounted) return null;

    return (
        <div
            className="glass-panel"
            style={{
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                minWidth: '320px',
            }}
        >
            <h2 style={{ 
                fontSize: '3rem', 
                fontWeight: 'bold', 
                color: 'var(--color-nexus-accent)', 
                lineHeight: 1 
            }}>
                {format(date, 'HH:mm')}
            </h2>
            <p style={{ 
                fontSize: '1.2rem', 
                color: 'var(--text-primary)', 
                opacity: 0.8 
            }}>
                {format(date, 'EEEE, MMMM do, yyyy')}
            </p>
            <p style={{ 
                fontSize: '0.9rem', 
                color: 'var(--color-nexus-accent-2)', 
                marginTop: '0.5rem' 
            }}>
                System Status: Nominal
            </p>
        </div>
    );
}
