'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const [isPinned, setIsPinned] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // Sidebar is expanded if it's pinned OR hovered
    const isExpanded = isPinned || isHovered;

    // Content margin depends ONLY on pinned state
    // If pinned, margin is 250px. If not pinned, margin is 60px (collapsed width).
    // When hovering (not pinned), sidebar expands over content (overlay), so margin stays 60px.
    const contentMargin = isPinned ? '250px' : '60px';

    return (
        <>
            <TopNav />
            <Sidebar
                isPinned={isPinned}
                onTogglePin={() => setIsPinned(!isPinned)}
                onHoverChange={setIsHovered}
                isExpanded={isExpanded}
            />
            <main
                style={{
                    marginLeft: contentMargin,
                    paddingTop: '100px', // Clear TopNav
                    paddingRight: '2rem',
                    paddingBottom: '2rem',
                    minHeight: '100vh',
                    transition: 'margin-left 0.3s ease',
                    paddingLeft: '2rem'
                }}
            >
                {children}
            </main>
        </>
    );
}
