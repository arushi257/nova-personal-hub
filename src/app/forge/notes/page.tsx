'use client';

import { useState, useEffect, useRef, KeyboardEvent, CSSProperties } from 'react';
import {
    Plus,
    Trash2,
    ChevronRight,
    ChevronDown,
    Folder as FolderIcon,
    FolderPlus,
    FileText,
    Bold,
    Italic,
    Underline,
    Palette,
    Type,
    ChevronLeft,
} from 'lucide-react';
import styles from './page.module.css';

interface Block {
    id: string;
    type: 'paragraph' | 'h1' | 'h2' | 'h3' | 'bullet' | 'numbered' | 'todo' | 'code';
    content: string;
    checked?: boolean;
    indent: number;
}

interface Page {
    id: string;
    title: string;
    icon: string;
    blocks: Block[];
    parentId?: string;
    children?: Page[];
    createdAt: string;
    updatedAt: string;
    kind?: 'page' | 'folder';
    color?: string;
}

const PLACEHOLDERS: Record<Block['type'], string> = {
    paragraph: 'Type / for commands',
    h1: 'Heading 1',
    h2: 'Heading 2',
    h3: 'Heading 3',
    bullet: 'List item',
    numbered: 'Numbered item',
    todo: 'To-do',
    code: 'Code',
};

const INITIAL_PAGES: Page[] = [
    {
        id: '1',
        title: 'Getting Started',
        icon: '🚀',
        kind: 'page',
        blocks: [
            { id: 'b1', type: 'h1', content: 'Welcome to Notes', indent: 0 },
            { id: 'b2', type: 'paragraph', content: 'This is a Notion-style editor. Try these features:', indent: 0 },
            { id: 'b3', type: 'bullet', content: 'Type / for slash commands', indent: 0 },
            { id: 'b4', type: 'bullet', content: 'Press Enter to create new blocks', indent: 0 },
            { id: 'b5', type: 'bullet', content: 'Use **bold** and *italic* markdown', indent: 0 },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'f-1',
        title: 'Projects',
        icon: '📁',
        kind: 'folder',
        color: '#d4b483',
        blocks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
];

const renderContent = (content: string) => {
    const escaped = content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    const underlined = escaped.replace(/__(.+?)__/g, '<u>$1</u>');
    const bolded = underlined.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    const italicized = bolded.replace(/\*(.+?)\*/g, '<em>$1</em>');
    return italicized.replace(/`(.+?)`/g, '<code>$1</code>');
};

export default function NotesPage() {
    const [pages, setPages] = useState<Page[]>(INITIAL_PAGES);
    const [activePageId, setActivePageId] = useState('1');
    const [showSlashMenu, setShowSlashMenu] = useState(false);
    const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null); // slash menu target
    const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null); // toolbar target
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [fontFamily, setFontFamily] = useState<'system' | 'serif' | 'mono' | 'inter' | 'lora' | 'space'>('system');
    const [fontSize, setFontSize] = useState(16);
    const [textColor, setTextColor] = useState('#37352f');
    const [outlineOpen, setOutlineOpen] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dropTargetId, setDropTargetId] = useState<string | null>(null);
    const [history, setHistory] = useState<Page[][]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const bootstrappedRef = useRef(false);
    const restoringRef = useRef(false);
    const saveTimerRef = useRef<number | null>(null);
    const canRedo = historyIndex >= 0 && historyIndex < history.length - 1;

    const firstPageId = pages.find(p => p.kind !== 'folder')?.id;
    const activePage = pages.find(p => p.id === activePageId && p.kind !== 'folder') || (firstPageId ? pages.find(p => p.id === firstPageId) : undefined);

    useEffect(() => {
        const saved = localStorage.getItem('notion-notes-pages');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length) {
                    const normalized = parsed.map((p: Page) => ({ ...p, kind: p.kind || 'page' }));
                    setPages(normalized);
                    const first = normalized.find(p => p.kind !== 'folder');
                    if (first) {
                        setActivePageId(first.id);
                    }
                }
            } catch {
                localStorage.removeItem('notion-notes-pages');
            }
        }
    }, []);

    useEffect(() => {
        if (!bootstrappedRef.current) {
            setHistory([pages]);
            setHistoryIndex(0);
            bootstrappedRef.current = true;
            return;
        }
        if (restoringRef.current) {
            restoringRef.current = false;
            return;
        }
        setHistory((prev) => {
            const trimmed = prev.slice(0, historyIndex + 1);
            const next = [...trimmed, pages];
            const capped = next.length > 50 ? next.slice(next.length - 50) : next;
            setHistoryIndex(capped.length - 1);
            return capped;
        });
    }, [pages, historyIndex]);

    useEffect(() => {
        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
        }
        saveTimerRef.current = window.setTimeout(() => {
            localStorage.setItem('notion-notes-pages', JSON.stringify(pages));
        }, 400);
        return () => {
            if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current);
            }
        };
    }, [pages]);

    const updateBlock = (blockId: string, content: string) => {
        const timestamp = new Date().toISOString();
        setPages(prevPages =>
            prevPages.map(p =>
                p.id === activePageId
                    ? {
                        ...p,
                        updatedAt: timestamp,
                        blocks: p.blocks.map(b => b.id === blockId ? { ...b, content } : b),
                    }
                    : p
            )
        );
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>, blockId: string) => {
        if (!activePage) return;
        const block = activePage.blocks.find(b => b.id === blockId);
        if (!block) return;
        const currentContent = e.currentTarget.textContent || '';

        if (e.key === 'Escape') {
            setShowSlashMenu(false);
            return;
        }

        // Enter key - create new block
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const blockIndex = activePage.blocks.findIndex(b => b.id === blockId);
            const newBlock: Block = {
                id: Date.now().toString(),
                type: 'paragraph',
                content: '',
                indent: block.indent,
            };

            const newBlocks = [...activePage.blocks];
            newBlocks.splice(blockIndex + 1, 0, newBlock);

            const timestamp = new Date().toISOString();
            setPages(prevPages =>
                prevPages.map(p =>
                    p.id === activePageId ? { ...p, blocks: newBlocks, updatedAt: timestamp } : p
                )
            );

            setTimeout(() => {
                const nextInput = document.querySelector(`[data-block-id="${newBlock.id}"]`) as HTMLElement;
                nextInput?.focus();
            }, 0);
        }

        // Backspace on empty block - delete it
        if (e.key === 'Backspace' && currentContent === '') {
            e.preventDefault();
            if (activePage.blocks.length > 1) {
                const blockIndex = activePage.blocks.findIndex(b => b.id === blockId);
                if (blockIndex > 0) {
                    const newBlocks = activePage.blocks.filter(b => b.id !== blockId);
                    const timestamp = new Date().toISOString();
                    setPages(prevPages =>
                        prevPages.map(p =>
                            p.id === activePageId ? { ...p, blocks: newBlocks, updatedAt: timestamp } : p
                        )
                    );

                    const prevBlock = activePage.blocks[blockIndex - 1];
                    setTimeout(() => {
                        const prevInput = document.querySelector(`[data-block-id="${prevBlock.id}"]`) as HTMLElement;
                        prevInput?.focus();
                    }, 0);
                }
            }
        }

        // Detect slash command
        if (e.key === '/' && !showSlashMenu) {
            const rect = e.currentTarget.getBoundingClientRect();
            setSlashMenuPosition({ top: rect.bottom + 5, left: rect.left });
            setShowSlashMenu(true);
            setActiveBlockId(blockId);
        }
    };

    const applyFormatting = (format: 'bold' | 'italic' | 'underline') => {
        if (!activePage) return;
        const targetId = focusedBlockId || activePage.blocks[0]?.id;
        if (!targetId) return;
        const block = activePage.blocks.find(b => b.id === targetId);
        if (!block) return;

        const wrapMap = {
            bold: { open: '**', close: '**' },
            italic: { open: '*', close: '*' },
            underline: { open: '__', close: '__' },
        } as const;

        const { open, close } = wrapMap[format];
        const alreadyWrapped = block.content.startsWith(open) && block.content.endsWith(close);
        const content = alreadyWrapped ? block.content.slice(open.length, -close.length) : `${open}${block.content}${close}`;

        updateBlock(block.id, content);
    };

    const handleUndo = () => {
        if (historyIndex <= 0) return;
        const nextIndex = historyIndex - 1;
        restoringRef.current = true;
        setHistoryIndex(nextIndex);
        setPages(history[nextIndex]);
    };

    const handleRedo = () => {
        if (!canRedo) return;
        const nextIndex = historyIndex + 1;
        restoringRef.current = true;
        setHistoryIndex(nextIndex);
        setPages(history[nextIndex]);
    };

    const convertBlockType = (type: Block['type']) => {
        if (!activeBlockId) return;

        const timestamp = new Date().toISOString();
        setPages(prevPages =>
            prevPages.map(p =>
                p.id === activePageId
                    ? {
                        ...p,
                        updatedAt: timestamp,
                        blocks: p.blocks.map(b =>
                            b.id === activeBlockId
                                ? { ...b, type, content: b.content.replace(/\/$/, '') }
                                : b
                        ),
                    }
                    : p
            )
        );

        setShowSlashMenu(false);
        setActiveBlockId(null);
    };

    const addNewPage = (parentId?: string) => {
        const newPage: Page = {
            id: Date.now().toString(),
            title: 'Untitled',
            icon: '📄',
            kind: 'page',
            blocks: [{ id: Date.now().toString() + '-b1', type: 'paragraph', content: '', indent: 0 }],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            parentId,
        };
        setPages(prev => [...prev, newPage]);
        setActivePageId(newPage.id);
    };

    const addNewFolder = (parentId?: string) => {
        const newFolder: Page = {
            id: Date.now().toString(),
            title: 'New Folder',
            icon: '📁',
            kind: 'folder',
            color: '#d4b483',
            blocks: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            parentId,
        };
        setPages(prev => [...prev, newFolder]);
        setExpandedFolders(prev => {
            const next = new Set(prev);
            if (parentId) next.add(parentId);
            next.add(newFolder.id);
            return next;
        });
    };

    const collectDescendants = (pageId: string, list: Page[]): Set<string> => {
        const toDelete = new Set<string>([pageId]);
        const recurse = (id: string) => {
            list.forEach(p => {
                if (p.parentId === id) {
                    toDelete.add(p.id);
                    recurse(p.id);
                }
            });
        };
        recurse(pageId);
        return toDelete;
    };

    const isDescendant = (sourceId: string, targetId: string, list: Page[]): boolean => {
        if (sourceId === targetId) return true;
        const descendants = collectDescendants(sourceId, list);
        return descendants.has(targetId);
    };

    const deletePage = (pageId: string) => {
        if (!window.confirm('Delete this page and its children?')) return;
        if (pages.length === 0) return;
        const toDelete = collectDescendants(pageId, pages);
        const remainingPages = pages.filter(p => !toDelete.has(p.id));
        setPages(remainingPages);

        if (toDelete.has(activePageId)) {
            const nextPage = remainingPages.find(p => p.kind !== 'folder');
            if (nextPage) {
                setActivePageId(nextPage.id);
            }
        }
    };

    const renderBlock = (block: Block) => {
        const Tag = block.type === 'paragraph' ? 'div' : block.type.startsWith('h') ? block.type as 'h1' | 'h2' | 'h3' : 'div';
        const indentStyle = { paddingLeft: `${block.indent * 24}px` };
        const htmlContent = renderContent(block.content);
        const numberIndex = activePage ? activePage.blocks.filter(b => b.type === 'numbered').findIndex(b => b.id === block.id) + 1 : 1;

        if (block.type === 'bullet') {
            return (
                <div className={styles.blockWrapper} style={indentStyle} key={block.id}>
                    <span className={styles.bulletPoint}>•</span>
                    <div
                        className={styles.blockContent}
                        contentEditable
                        suppressContentEditableWarning
                        role="textbox"
                        aria-label={block.type}
                        data-block-id={block.id}
                        data-placeholder={PLACEHOLDERS[block.type]}
                        onInput={(e) => updateBlock(block.id, e.currentTarget.textContent || '')}
                        onKeyDown={(e) => handleKeyDown(e, block.id)}
                        onFocus={() => setFocusedBlockId(block.id)}
                        dangerouslySetInnerHTML={{ __html: htmlContent }}
                    />
                </div>
            );
        }

        if (block.type === 'numbered') {
            return (
                <div className={styles.blockWrapper} style={indentStyle} key={block.id}>
                    <span className={styles.bulletPoint}>{numberIndex}.</span>
                    <div
                        className={styles.blockContent}
                        contentEditable
                        suppressContentEditableWarning
                        role="textbox"
                        aria-label={block.type}
                        data-block-id={block.id}
                        data-placeholder={PLACEHOLDERS[block.type]}
                        onInput={(e) => updateBlock(block.id, e.currentTarget.textContent || '')}
                        onKeyDown={(e) => handleKeyDown(e, block.id)}
                        onFocus={() => setFocusedBlockId(block.id)}
                        dangerouslySetInnerHTML={{ __html: htmlContent }}
                    />
                </div>
            );
        }

        if (block.type === 'todo') {
            return (
                <div className={styles.blockWrapper} style={indentStyle} key={block.id}>
                    <input
                        type="checkbox"
                        checked={block.checked || false}
                        onChange={(e) => {
                            const timestamp = new Date().toISOString();
                            setPages(prevPages =>
                                prevPages.map(p =>
                                    p.id === activePageId
                                        ? {
                                            ...p,
                                            updatedAt: timestamp,
                                            blocks: p.blocks.map(b => b.id === block.id ? { ...b, checked: e.target.checked } : b),
                                        }
                                        : p
                                )
                            );
                        }}
                        className={styles.checkbox}
                    />
                    <div
                        className={styles.blockContent}
                        contentEditable
                        suppressContentEditableWarning
                        role="textbox"
                        aria-label={block.type}
                        data-block-id={block.id}
                        data-placeholder={PLACEHOLDERS[block.type]}
                        onInput={(e) => updateBlock(block.id, e.currentTarget.textContent || '')}
                        onKeyDown={(e) => handleKeyDown(e, block.id)}
                        onFocus={() => setFocusedBlockId(block.id)}
                        style={{ textDecoration: block.checked ? 'line-through' : 'none' }}
                        dangerouslySetInnerHTML={{ __html: htmlContent }}
                    />
                </div>
            );
        }

        return (
            <Tag className={styles[block.type]} style={indentStyle} key={block.id}>
                <div
                    className={styles.blockContent}
                    contentEditable
                    suppressContentEditableWarning
                    role="textbox"
                    aria-label={block.type}
                    data-block-id={block.id}
                    data-placeholder={PLACEHOLDERS[block.type]}
                    onInput={(e) => updateBlock(block.id, e.currentTarget.textContent || '')}
                    onKeyDown={(e) => handleKeyDown(e, block.id)}
                    onFocus={() => setFocusedBlockId(block.id)}
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
            </Tag>
        );
    };

    const toggleFolder = (folderId: string) => {
        setExpandedFolders(prev => {
            const next = new Set(prev);
            if (next.has(folderId)) {
                next.delete(folderId);
            } else {
                next.add(folderId);
            }
            return next;
        });
    };

    const renamePage = (pageId: string) => {
        const page = pages.find(p => p.id === pageId);
        if (!page) return;
        const nextTitle = window.prompt('Rename', page.title);
        if (nextTitle === null) return;
        const trimmed = nextTitle.trim();
        if (!trimmed) return;
        const timestamp = new Date().toISOString();
        setPages(prev =>
            prev.map(p => p.id === pageId ? { ...p, title: trimmed, updatedAt: timestamp } : p)
        );
    };

    const updateFolderColor = (pageId: string, color: string) => {
        const timestamp = new Date().toISOString();
        setPages(prev =>
            prev.map(p => p.id === pageId ? { ...p, color, updatedAt: timestamp } : p)
        );
    };

    const renderTree = (parentId?: string, depth = 0) => {
        return pages
            .filter(p => (parentId ? p.parentId === parentId : !p.parentId))
            .map(page => {
                const isFolder = page.kind === 'folder';
                const isExpanded = expandedFolders.has(page.id);
                const isDropTarget = dropTargetId === page.id;
                return (
                    <div key={page.id}>
                        <div
                            className={`${styles.pageItem} ${page.id === activePageId ? styles.activePage : ''} ${isDropTarget ? styles.dropTarget : ''}`}
                            style={{ paddingLeft: `${depth * 14 + 8}px` }}
                            draggable
                            onDragStart={() => {
                                setDraggingId(page.id);
                                setDropTargetId(null);
                            }}
                            onDragEnd={() => {
                                setDraggingId(null);
                                setDropTargetId(null);
                            }}
                            onDragOver={(e) => {
                                if (!draggingId || !isFolder) return;
                                if (draggingId === page.id) return;
                                if (isDescendant(draggingId, page.id, pages)) return;
                                e.preventDefault();
                                setDropTargetId(page.id);
                            }}
                            onDragLeave={() => {
                                setDropTargetId(prev => (prev === page.id ? null : prev));
                            }}
                            onDrop={() => {
                                if (!draggingId || !isFolder) return;
                                if (draggingId === page.id) return;
                                if (isDescendant(draggingId, page.id, pages)) return;
                                const timestamp = new Date().toISOString();
                                setPages(prev =>
                                    prev.map(p => p.id === draggingId ? { ...p, parentId: page.id, updatedAt: timestamp } : p)
                                );
                                setExpandedFolders(prev => new Set(prev).add(page.id));
                                setDraggingId(null);
                                setDropTargetId(null);
                            }}
                            onClick={() => {
                                if (isFolder) {
                                    toggleFolder(page.id);
                                } else {
                                    setActivePageId(page.id);
                                }
                            }}
                        >
                            {isFolder ? (
                                <button className={styles.chevronBtn} onClick={(e) => { e.stopPropagation(); toggleFolder(page.id); }}>
                                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </button>
                            ) : (
                                <span className={styles.chevronPlaceholder} />
                            )}
                            <span className={styles.pageIcon} style={isFolder && page.color ? { color: page.color } : {}}>
                                {isFolder ? <FolderIcon size={14} className={styles.folderIconFilled} /> : <FileText size={14} />}
                            </span>
                            <span className={styles.pageTitle}>{page.title}</span>
                            <div className={styles.itemActions}>
                                {isFolder && (
                                    <button
                                        className={styles.iconBtn}
                                        title="Add page"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            addNewPage(page.id);
                                            setExpandedFolders(prev => new Set(prev).add(page.id));
                                        }}
                                    >
                                        <Plus size={14} />
                                    </button>
                                )}
                                {isFolder && (
                                    <button
                                        className={styles.iconBtn}
                                        title="Add folder"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            addNewFolder(page.id);
                                        }}
                                    >
                                        <FolderPlus size={14} />
                                    </button>
                                )}
                                {isFolder && (
                                    <label className={styles.colorSwatch} title="Folder color" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="color"
                                            value={page.color || '#d4b483'}
                                            onChange={(e) => updateFolderColor(page.id, e.target.value)}
                                        />
                                        <span style={{ background: page.color || '#d4b483' }} />
                                    </label>
                                )}
                                <button
                                    className={styles.iconBtn}
                                    title="Rename"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        renamePage(page.id);
                                    }}
                                >
                                    <Type size={14} />
                                </button>
                                {pages.length > 1 && (
                                    <button
                                        className={styles.deletePageBtn}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deletePage(page.id);
                                        }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                        {isFolder && isExpanded && (
                            <div className={styles.childContainer}>
                                {renderTree(page.id, depth + 1)}
                            </div>
                        )}
                    </div>
                );
            });
    };

    const fontFamilies: Record<typeof fontFamily, string> = {
        system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
        serif: "Georgia, 'Times New Roman', serif",
        mono: "'SF Mono', Menlo, Monaco, 'Courier New', monospace",
        inter: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
        lora: "'Lora', 'Georgia', serif",
        space: "'Space Grotesk', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
    };

    const headings = activePage
        ? activePage.blocks
            .filter(b => b.type === 'h1' || b.type === 'h2' || b.type === 'h3')
            .map(b => ({ id: b.id, text: b.content || 'Untitled', level: Number(b.type.slice(1)) }))
        : [];

    const jumpToBlock = (id: string) => {
        const el = document.querySelector(`[data-block-id="${id}"]`) as HTMLElement | null;
        if (!el) return;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
        setFocusedBlockId(id);
    };

    const editorStyle = {
        ['--font-family' as string]: fontFamilies[fontFamily],
        ['--base-font-size' as string]: `${fontSize}px`,
        ['--h1-size' as string]: `${fontSize * 1.8}px`,
        ['--h2-size' as string]: `${fontSize * 1.45}px`,
        ['--h3-size' as string]: `${fontSize * 1.25}px`,
        ['--text-color' as string]: textColor,
    } as CSSProperties;

    return (
        <div className={styles.container}>
            {/* Sidebar */}
            <div className={`${styles.sidebar} ${!sidebarOpen ? styles.sidebarCollapsed : ''}`}>
                <div className={styles.sidebarHeader}>
                    <button
                        className={styles.collapseBtn}
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        aria-label="Toggle sidebar"
                    >
                        {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                    </button>
                    <span className={styles.sidebarTitle}>Pages</span>
                </div>
                <div className={styles.sectionRow}>
                    <span className={styles.sectionLabel}>Projects</span>
                    <div className={styles.sectionActions}>
                        <button className={styles.addPageBtn} onClick={() => addNewFolder()}>
                            <FolderPlus size={16} />
                        </button>
                        <button className={styles.addPageBtn} onClick={() => addNewPage()}>
                            <Plus size={16} />
                        </button>
                    </div>
                </div>

                <div className={styles.pageList}>{renderTree()}</div>
            </div>

            {/* Outline / Index */}
            <div className={`${styles.outline} ${!outlineOpen ? styles.outlineCollapsed : ''}`}>
                <div className={styles.outlineHeader}>
                    <button
                        className={styles.outlineToggle}
                        onClick={() => setOutlineOpen(!outlineOpen)}
                        aria-label="Toggle outline"
                    >
                        {outlineOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    {outlineOpen && <span className={styles.outlineTitle}>Index</span>}
                </div>
                {outlineOpen && (
                    <div className={styles.outlineList}>
                        {headings.length === 0 && <div className={styles.emptyOutline}>No headings yet</div>}
                        {headings.map(h => (
                            <button
                                key={h.id}
                                className={styles.outlineItem}
                                style={{ paddingLeft: `${(h.level - 1) * 12 + 8}px` }}
                                onClick={() => jumpToBlock(h.id)}
                            >
                                {h.text || 'Untitled'}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Editor */}
            <div className={styles.editor} style={editorStyle}>
                <div className={styles.pageHeader}>
                    <input
                        type="text"
                        className={styles.pageTitle}
                        value={activePage?.title || ''}
                        onChange={(e) => {
                            const timestamp = new Date().toISOString();
                            const nextTitle = e.target.value;
                            setPages(prevPages =>
                                prevPages.map(p =>
                                    p.id === activePageId ? { ...p, title: nextTitle, updatedAt: timestamp } : p
                                )
                            );
                        }}
                        placeholder="Untitled"
                    />
                </div>

                <div className={styles.toolbar}>
                    <div className={styles.toolbarGroup}>
                        <label className={styles.toolbarLabel}>Font</label>
                        <select
                            className={styles.select}
                            value={fontFamily}
                            onChange={(e) => setFontFamily(e.target.value as typeof fontFamily)}
                        >
                            <option value="system">System</option>
                            <option value="serif">Serif</option>
                            <option value="mono">Mono</option>
                            <option value="inter">Inter</option>
                            <option value="lora">Lora</option>
                            <option value="space">Space Grotesk</option>
                        </select>
                    </div>
                    <div className={styles.toolbarGroup}>
                        <label className={styles.toolbarLabel}>Size</label>
                        <input
                            type="range"
                            min={14}
                            max={22}
                            value={fontSize}
                            onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                            className={styles.range}
                        />
                        <span className={styles.rangeValue}>{fontSize}px</span>
                    </div>
                    <div className={styles.toolbarGroup}>
                        <label className={styles.toolbarLabel}>History</label>
                        <div className={styles.formatGroup}>
                            <button className={styles.formatBtn} onClick={handleUndo} disabled={historyIndex <= 0} title="Undo">
                                Undo
                            </button>
                            <button className={styles.formatBtn} onClick={handleRedo} disabled={!canRedo} title="Redo">
                                Redo
                            </button>
                        </div>
                    </div>
                    <div className={styles.toolbarGroup}>
                        <label className={styles.toolbarLabel}>Color</label>
                        <div className={styles.colorControl}>
                            <Palette size={16} />
                            <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} />
                        </div>
                    </div>
                    <div className={styles.toolbarGroup}>
                        <label className={styles.toolbarLabel}>Format</label>
                        <div className={styles.formatGroup}>
                            <button className={styles.formatBtn} onClick={() => applyFormatting('bold')} title="Bold">
                                <Bold size={14} />
                            </button>
                            <button className={styles.formatBtn} onClick={() => applyFormatting('italic')} title="Italic">
                                <Italic size={14} />
                            </button>
                            <button className={styles.formatBtn} onClick={() => applyFormatting('underline')} title="Underline">
                                <Underline size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className={styles.blocksContainer}>
                    {activePage?.blocks.map(block => renderBlock(block))}
                </div>

                {showSlashMenu && (
                    <div className={styles.slashMenu} style={{ top: slashMenuPosition.top, left: slashMenuPosition.left }}>
                        <div className={styles.menuItem} onClick={() => convertBlockType('h1')}>
                            <strong>H1</strong> <span>Heading 1</span>
                        </div>
                        <div className={styles.menuItem} onClick={() => convertBlockType('h2')}>
                            <strong>H2</strong> <span>Heading 2</span>
                        </div>
                        <div className={styles.menuItem} onClick={() => convertBlockType('h3')}>
                            <strong>H3</strong> <span>Heading 3</span>
                        </div>
                        <div className={styles.menuItem} onClick={() => convertBlockType('bullet')}>
                            • <span>Bulleted list</span>
                        </div>
                        <div className={styles.menuItem} onClick={() => convertBlockType('todo')}>
                            ☐ <span>To-do list</span>
                        </div>
                        <div className={styles.menuItem} onClick={() => convertBlockType('code')}>
                            { } <span>Code</span>
                        </div>
                    </div>
                )}
            </div>

            {showSlashMenu && (
                <div className={styles.menuOverlay} onClick={() => setShowSlashMenu(false)} />
            )}
        </div>
    );
}
