'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Eraser, Hand, Pencil, Plus, Trash2, Undo2 } from 'lucide-react';
import styles from './page.module.css';

type Point = { x: number; y: number; pressure: number };
type Stroke = { id: string; color: string; width: number; points: Point[] };
type Mode = 'move' | 'draw' | 'erase' | 'connect';
type EraseType = 'stroke' | 'partial';
type AnchorType = 'card' | 'flow';
type AnchorRef = { type: AnchorType; id: string };

type FlowNodeType = 'box' | 'diamond' | 'ellipse';

type Card = {
    id: number;
    x: number;
    y: number;
    title: string;
    content: string;
    doodle?: Stroke[];
    mediaUrl?: string;
    groupId?: string;
};

type FlowNode = {
    id: string;
    type: FlowNodeType;
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    groupId?: string;
};

type Edge = {
    id: string;
    from: AnchorRef;
    to: AnchorRef;
    label?: string;
    groupId?: string;
};

type BoardState = {
    cards: Card[];
    flowNodes: FlowNode[];
    edges: Edge[];
    strokes: Stroke[];
};

const CARD_WIDTH = 220;
const CARD_HEIGHT = 180;
const initialCards: Card[] = [
    { id: 1, x: 100, y: 100, title: 'Idea 1', content: 'Combine Ember and Quark for a productivity playlist.', doodle: [] },
    { id: 2, x: 400, y: 200, title: 'Refactor', content: 'Clean up the sidebar code.', doodle: [] },
    { id: 3, x: 200, y: 400, title: 'Design', content: 'Add more glassmorphism to the dashboard.', doodle: [] },
];
const initialFlow: FlowNode[] = [
    { id: 'f1', type: 'box', x: 650, y: 180, width: 180, height: 90, text: 'Flow box' },
    { id: 'f2', type: 'diamond', x: 900, y: 320, width: 140, height: 140, text: 'Decision' },
];

const strokeColors = ['#FFD166', '#F497DA', '#A5D8FF', '#C3F0CA', '#F28B82', '#E9D5FF'];
const STORAGE_KEY = 'forge-ideas-strokes';
const BOARD_STORAGE_KEY = 'forge-ideas-board';
const DEFAULT_WIDTH = 6;
const DEFAULT_ERASER_RADIUS = 18;
const MIN_ERASER_RADIUS = 8;
const MAX_ERASER_RADIUS = 40;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 1.8;
const ZOOM_STEP = 0.1;
const PLANE_SIZE = 4000;
const MINIMAP_SCALE = 10;
const GROUP_COLORS = ['#21D4FD', '#F6C643', '#A78BFA', '#34D399', '#F472B6', '#38BDF8'];

function averagePressure(points: Point[]) {
    if (!points.length) return 1;
    const total = points.reduce((sum, p) => sum + (p.pressure || 0.7), 0);
    return Math.max(0.35, total / points.length);
}

function pointsToString(points: Point[]) {
    return points.map((p) => `${p.x},${p.y}`).join(' ');
}

function isPointNearStroke(point: Point, stroke: Stroke, radius: number) {
    const radiusSq = radius * radius;
    return stroke.points.some((p) => {
        const dx = p.x - point.x;
        const dy = p.y - point.y;
        return dx * dx + dy * dy <= radiusSq;
    });
}

type DoodlePadProps = {
    strokes: Stroke[];
    color: string;
    baseWidth: number;
    onChange: (strokes: Stroke[]) => void;
    showWhenEmpty?: boolean;
};

function DoodlePad({ strokes, color, baseWidth, onChange, showWhenEmpty = true }: DoodlePadProps) {
    if (!showWhenEmpty && !strokes.length) {
        return null;
    }

    const padRef = useRef<SVGSVGElement>(null);
    const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);

    const getPoint = (event: React.PointerEvent<SVGSVGElement>) => {
        if (!padRef.current) return null;
        const rect = padRef.current.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            pressure: event.pressure || 0.7,
        };
    };

    const handleDown = (event: React.PointerEvent<SVGSVGElement>) => {
        const point = getPoint(event);
        if (!point) return;
        const stroke: Stroke = { id: crypto.randomUUID(), color, width: baseWidth, points: [point] };
        setCurrentStroke(stroke);
        padRef.current?.setPointerCapture(event.pointerId);
        event.preventDefault();
    };

    const handleMove = (event: React.PointerEvent<SVGSVGElement>) => {
        if (!currentStroke) return;
        const point = getPoint(event);
        if (!point) return;
        setCurrentStroke((prev) => (prev ? { ...prev, points: [...prev.points, point] } : prev));
        event.preventDefault();
    };

    const finalize = (event: React.PointerEvent<SVGSVGElement>) => {
        if (!currentStroke) return;
        const point = getPoint(event);
        const strokeToSave = point ? { ...currentStroke, points: [...currentStroke.points, point] } : currentStroke;
        onChange([...strokes, strokeToSave]);
        setCurrentStroke(null);
        padRef.current?.releasePointerCapture(event.pointerId);
        event.preventDefault();
    };

    const strokeWidth = (stroke: Stroke) => stroke.width * averagePressure(stroke.points);

    return (
        <div className={styles.doodleShell}>
            {(strokes.length > 0 || currentStroke) && (
                <div className={styles.doodleHeader}>
                    <span>Doodle</span>
                    <div className={styles.doodleActions}>
                        <button className={styles.iconButton} onClick={() => onChange(strokes.slice(0, -1))} disabled={!strokes.length}>
                            <Undo2 size={14} />
                        </button>
                        <button className={styles.iconButton} onClick={() => onChange([])} disabled={!strokes.length && !currentStroke}>
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            )}
            <svg
                className={styles.doodleCanvas}
                ref={padRef}
                width="100%"
                height="140"
                onPointerDown={handleDown}
                onPointerMove={handleMove}
                onPointerUp={finalize}
                onPointerCancel={finalize}
                onPointerLeave={finalize}
            >
                <g className={styles.strokeGroup}>
                    {strokes.map((stroke) => (
                        <polyline
                            key={stroke.id}
                            points={pointsToString(stroke.points)}
                            stroke={stroke.color}
                            strokeWidth={strokeWidth(stroke)}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity={0.9}
                        />
                    ))}
                    {currentStroke && (
                        <polyline
                            points={pointsToString(currentStroke.points)}
                            stroke={currentStroke.color}
                            strokeWidth={strokeWidth(currentStroke)}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity={0.6}
                        />
                    )}
                </g>
            </svg>
        </div>
    );
}

function trimStrokeByPoint(stroke: Stroke, point: Point, radius: number) {
    const radiusSq = radius * radius;
    const segments: Stroke[] = [];
    let current: Point[] = [];

    for (const p of stroke.points) {
        const dx = p.x - point.x;
        const dy = p.y - point.y;
        const inside = dx * dx + dy * dy <= radiusSq;

        if (inside) {
            if (current.length > 1) {
                segments.push({ ...stroke, id: crypto.randomUUID(), points: current });
            }
            current = [];
        } else {
            current.push(p);
        }
    }

    if (current.length > 1) {
        segments.push({ ...stroke, id: crypto.randomUUID(), points: current });
    }

    return segments;
}

export default function IdeaBoardPage() {
    const constraintsRef = useRef<HTMLDivElement>(null);
    const drawingSurfaceRef = useRef<SVGSVGElement>(null);
    const erasingRef = useRef(false);

    const [cards, setCards] = useState<Card[]>(initialCards);
    const [mode, setMode] = useState<Mode>('move');
    const [eraseType, setEraseType] = useState<EraseType>('stroke');
    const [eraseMenuOpen, setEraseMenuOpen] = useState(false);
    const [drawMenuOpen, setDrawMenuOpen] = useState(false);
    const [inkColor, setInkColor] = useState(strokeColors[0]);
    const [baseWidth, setBaseWidth] = useState(DEFAULT_WIDTH);
    const [eraserRadius, setEraserRadius] = useState(DEFAULT_ERASER_RADIUS);
    const [zoomScale, setZoomScale] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const panStartRef = useRef<{ x: number; y: number } | null>(null);
    const [flowNodes, setFlowNodes] = useState<FlowNode[]>(initialFlow);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [groupColors, setGroupColors] = useState<Record<string, string>>({});
    const [paletteIndex, setPaletteIndex] = useState(0);
    const [connectingFrom, setConnectingFrom] = useState<AnchorRef | null>(null);
    const [connectingPoint, setConnectingPoint] = useState<Point | null>(null);
    const [hoverAnchor, setHoverAnchor] = useState<AnchorRef | null>(null);
    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
    const [hasHydrated, setHasHydrated] = useState(false);
    const [hoveredStrokeId, setHoveredStrokeId] = useState<string | null>(null);
    const [editingCard, setEditingCard] = useState<Card | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [editMedia, setEditMedia] = useState('');
    const [editDoodle, setEditDoodle] = useState<Stroke[]>([]);
    const [viewport, setViewport] = useState({ width: 0, height: 0 });
    const [history, setHistory] = useState<BoardState[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const canRedo = historyIndex >= 0 && historyIndex < history.length - 1;
    const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
    const resizingRef = useRef<{ id: string; startX: number; startY: number; width: number; height: number } | null>(null);
    const cardDragStartRef = useRef<{ id: number; x: number; y: number } | null>(null);
    const nodeDragStartRef = useRef<{ id: string; x: number; y: number } | null>(null);
    const isDragActiveRef = useRef(false);
    const dragResetTimeoutRef = useRef<number | null>(null);
    const contentProximity = 160;

    useEffect(() => {
        setHasHydrated(true);
        try {
            const storedStrokes = localStorage.getItem(STORAGE_KEY);
            if (storedStrokes) {
                setStrokes(JSON.parse(storedStrokes));
            }
            const storedBoard = localStorage.getItem(BOARD_STORAGE_KEY);
            if (storedBoard) {
                const parsed = JSON.parse(storedBoard) as Partial<BoardState> & {
                    pan?: { x: number; y: number };
                    zoomScale?: number;
                    groupColors?: Record<string, string>;
                };
                setCards(parsed.cards ?? initialCards);
                setFlowNodes(parsed.flowNodes ?? initialFlow);
                setEdges(parsed.edges ?? []);
                setStrokes(parsed.strokes ?? []);
                if (parsed.pan) setPan(parsed.pan);
                if (parsed.zoomScale) setZoomScale(parsed.zoomScale);
                if (parsed.groupColors) setGroupColors(parsed.groupColors);
            }
        } catch (err) {
            console.error('Failed to load board', err);
        }
    }, []);

    useEffect(() => {
        if (!hasHydrated) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(strokes));
        } catch (err) {
            console.error('Failed to persist strokes', err);
        }
    }, [strokes, hasHydrated]);

    useEffect(() => {
        if (!hasHydrated) return;
        const payload = {
            cards,
            flowNodes,
            edges,
            strokes,
            pan,
            zoomScale,
            groupColors,
        };
        try {
            localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify(payload));
        } catch (err) {
            console.error('Failed to persist board', err);
        }
    }, [cards, flowNodes, edges, strokes, pan, zoomScale, groupColors, hasHydrated]);

    const snapshot = (): BoardState => structuredClone({ cards, flowNodes, edges, strokes });

    const pushHistory = (state: BoardState) => {
        setHistory((prev) => {
            const trimmed = prev.slice(0, historyIndex + 1);
            const next = [...trimmed, state];
            const capped = next.length > 50 ? next.slice(next.length - 50) : next;
            setHistoryIndex(capped.length - 1);
            return capped;
        });
    };

    useEffect(() => {
        if (hasHydrated && historyIndex === -1) {
            pushHistory(snapshot());
        }
    }, [hasHydrated]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!constraintsRef.current) return;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                setViewport({ width, height });
            }
        });
        observer.observe(constraintsRef.current);
        return () => observer.disconnect();
    }, []);

    const getPoint = (event: React.PointerEvent<SVGSVGElement>) => {
        if (!drawingSurfaceRef.current) return null;
        const rect = drawingSurfaceRef.current.getBoundingClientRect();
        return {
            x: (event.clientX - rect.left) / zoomScale,
            y: (event.clientY - rect.top) / zoomScale,
            pressure: event.pressure || 0.7,
        };
    };

    const handlePointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
        if (mode === 'move' && event.target === drawingSurfaceRef.current) {
            setIsPanning(true);
            panStartRef.current = { x: event.clientX - pan.x, y: event.clientY - pan.y };
            drawingSurfaceRef.current?.setPointerCapture(event.pointerId);
            event.preventDefault();
            return;
        }

        if (mode === 'erase') {
            const point = getPoint(event);
            if (!point) return;
            erasingRef.current = true;
            if (eraseType === 'stroke') {
                setStrokes((prev) => prev.filter((stroke) => !isPointNearStroke(point, stroke, eraserRadius)));
            } else {
                setStrokes((prev) =>
                    prev.flatMap((stroke) => trimStrokeByPoint(stroke, point, eraserRadius))
                );
            }
            drawingSurfaceRef.current?.setPointerCapture(event.pointerId);
            event.preventDefault();
            return;
        }

        if (mode !== 'draw') return;
        const point = getPoint(event);
        if (!point) return;

        const stroke: Stroke = {
            id: crypto.randomUUID(),
            color: inkColor,
            width: baseWidth,
            points: [point],
        };
        setCurrentStroke(stroke);
        drawingSurfaceRef.current?.setPointerCapture(event.pointerId);
        event.preventDefault();
    };

    const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
        if (isPanning && panStartRef.current) {
            setPan({
                x: event.clientX - panStartRef.current.x,
                y: event.clientY - panStartRef.current.y,
            });
            event.preventDefault();
            return;
        }

        if (mode === 'connect') {
            const point = getPoint(event);
            if (!point) return;
            setConnectingPoint(point);
            const anchor = findAnchorAt(point);
            setHoverAnchor(anchor);
            event.preventDefault();
            return;
        }

        if (mode === 'erase') {
            const point = getPoint(event);
            if (!point) return;
            if (erasingRef.current) {
                if (eraseType === 'stroke') {
                    setStrokes((prev) => prev.filter((stroke) => !isPointNearStroke(point, stroke, eraserRadius)));
                } else {
                    setStrokes((prev) =>
                        prev.flatMap((stroke) => trimStrokeByPoint(stroke, point, eraserRadius))
                    );
                }
            } else if (eraseType === 'stroke') {
                const hovered = strokes.find((stroke) => isPointNearStroke(point, stroke, eraserRadius));
                setHoveredStrokeId(hovered ? hovered.id : null);
            }
            event.preventDefault();
            return;
        }

        if (mode !== 'draw' || !currentStroke) return;
        const point = getPoint(event);
        if (!point) return;
        event.preventDefault();

        setCurrentStroke((prev) => (prev ? { ...prev, points: [...prev.points, point] } : prev));
    };

    const finalizeStroke = (event: React.PointerEvent<SVGSVGElement>) => {
        if (isPanning) {
            setIsPanning(false);
            panStartRef.current = null;
            drawingSurfaceRef.current?.releasePointerCapture(event.pointerId);
            return;
        }
        if (mode === 'connect') {
            setConnectingPoint(null);
            setHoverAnchor(null);
            return;
        }
        if (mode === 'erase') {
            erasingRef.current = false;
            setHoveredStrokeId(null);
            drawingSurfaceRef.current?.releasePointerCapture(event.pointerId);
            pushHistory(snapshot());
            return;
        }
        if (mode === 'connect') {
            setConnectingFrom(null);
            setConnectingPoint(null);
            setHoverAnchor(null);
            return;
        }
        if (mode !== 'draw' || !currentStroke) return;
        const point = getPoint(event);
        const strokeToSave = point ? { ...currentStroke, points: [...currentStroke.points, point] } : currentStroke;
        const nextStrokes = [...strokes, strokeToSave];
        applyState({ strokes: nextStrokes });
        setCurrentStroke(null);
        drawingSurfaceRef.current?.releasePointerCapture(event.pointerId);
        event.preventDefault();
    };

    const handleUndo = () => {
        if (historyIndex <= 0) return;
        const nextIndex = historyIndex - 1;
        const state = history[nextIndex];
        if (state) {
            applySnapshot(state);
            setHistoryIndex(nextIndex);
        }
    };

    const handleRedo = () => {
        if (!canRedo) return;
        const nextIndex = historyIndex + 1;
        const state = history[nextIndex];
        if (state) {
            applySnapshot(state);
            setHistoryIndex(nextIndex);
        }
    };

    const handleClear = () => {
        if (!window.confirm('Clear all doodles on this board? This cannot be undone.')) return;
        setCurrentStroke(null);
        applyState({ strokes: [] });
    };

    const strokeWidth = (stroke: Stroke) => stroke.width * averagePressure(stroke.points);

    const handleAddCard = () => {
        const rect = constraintsRef.current?.getBoundingClientRect();
        const centerX = rect ? rect.width / 2 : 200;
        const centerY = rect ? rect.height / 2 : 200;
        const jitter = () => Math.random() * 140 - 70;
        const nextId = cards.length ? Math.max(...cards.map((c) => c.id)) + 1 : 1;
        const nextCards = [
            ...cards,
            {
                id: nextId,
                x: centerX + jitter(),
                y: centerY + jitter(),
                title: `Idea ${nextId}`,
                content: 'New sticky note',
                doodle: [],
            },
        ];
        applyState({ cards: nextCards });
    };

    const zoomIn = () => setZoomScale((z) => Math.min(MAX_ZOOM, Number((z + ZOOM_STEP).toFixed(2))));
    const zoomOut = () => setZoomScale((z) => Math.max(MIN_ZOOM, Number((z - ZOOM_STEP).toFixed(2))));

    const handleColorSelect = (color: string) => {
        setInkColor(color);
        setMode('draw');
        setEraseMenuOpen(false);
        setDrawMenuOpen(false);
    };

    const handleDrawButton = () => {
        setMode('draw');
        setDrawMenuOpen((prev) => !prev);
        setEraseMenuOpen(false);
        setSelectedFlowId(null);
    };

    const handleEraseButton = () => {
        setMode('erase');
        setEraseMenuOpen((prev) => !prev);
        setHoveredStrokeId(null);
        setDrawMenuOpen(false);
        setSelectedFlowId(null);
    };

    const handleEraseSelect = (type: EraseType) => {
        setEraseType(type);
        setMode('erase');
        setEraseMenuOpen(false);
        setHoveredStrokeId(null);
    };

    const closeEraseMenu = () => setEraseMenuOpen(false);

    const handleCreateNode = (type: FlowNodeType) => {
        const cx = (-pan.x + (viewport.width || 800) / 2) / zoomScale;
        const cy = (-pan.y + (viewport.height || 600) / 2) / zoomScale;
        const size = type === 'diamond' ? 140 : 160;
        const newNode: FlowNode = {
            id: crypto.randomUUID(),
            type,
            x: cx - size / 2,
            y: cy - size / 2,
            width: type === 'diamond' ? 150 : 170,
            height: type === 'ellipse' ? 110 : 100,
            text: 'New node',
        };
        applyState({ flowNodes: [...flowNodes, newNode] });
    };

    const getGroupColor = (groupId?: string) => (groupId ? groupColors[groupId] : undefined);

    const cycleColor = (current?: string) => {
        const next = GROUP_COLORS[(paletteIndex + 1) % GROUP_COLORS.length];
        setPaletteIndex((i) => (i + 1) % GROUP_COLORS.length);
        return current ?? next;
    };

    const applyState = (next: Partial<BoardState>, options?: { skipHistory?: boolean }) => {
        const newState: BoardState = {
            cards: next.cards ?? cards,
            flowNodes: next.flowNodes ?? flowNodes,
            edges: next.edges ?? edges,
            strokes: next.strokes ?? strokes,
        };
        setCards(newState.cards);
        setFlowNodes(newState.flowNodes);
        setEdges(newState.edges);
        setStrokes(newState.strokes);
        if (!options?.skipHistory) {
            pushHistory(structuredClone(newState));
        }
    };

    const applySnapshot = (state: BoardState) => {
        setCards(state.cards);
        setFlowNodes(state.flowNodes);
        setEdges(state.edges);
        setStrokes(state.strokes);
    };

    const getAnchorRect = (ref: AnchorRef) => {
        if (ref.type === 'card') {
            const card = cards.find((c) => c.id.toString() === ref.id);
            if (!card) return null;
            return { x: card.x, y: card.y, width: CARD_WIDTH, height: CARD_HEIGHT, groupId: card.groupId };
        }
        const node = flowNodes.find((n) => n.id === ref.id);
        if (!node) return null;
        return { x: node.x, y: node.y, width: node.width, height: node.height, groupId: node.groupId };
    };

    const anchorCenter = (ref: AnchorRef) => {
        const rect = getAnchorRect(ref);
        if (!rect) return null;
        return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, groupId: rect.groupId };
    };

    const setAnchorGroup = (ref: AnchorRef, groupId?: string) => {
        if (ref.type === 'card') {
            setCards((prev) => prev.map((c) => (c.id.toString() === ref.id ? { ...c, groupId } : c)));
        } else {
            setFlowNodes((prev) => prev.map((n) => (n.id === ref.id ? { ...n, groupId } : n)));
        }
    };

    const updateGroupColor = (groupId: string, color: string) => {
        setGroupColors((prev) => ({ ...prev, [groupId]: color }));
    };

    const mergeGroups = (keep: string, drop: string) => {
        if (keep === drop) return keep;
        setCards((prev) => prev.map((c) => (c.groupId === drop ? { ...c, groupId: keep } : c)));
        setFlowNodes((prev) => prev.map((n) => (n.groupId === drop ? { ...n, groupId: keep } : n)));
        setEdges((prev) => prev.map((e) => (e.groupId === drop ? { ...e, groupId: keep } : e)));
        setGroupColors((prev) => {
            const { [drop]: _, ...rest } = prev;
            return rest;
        });
        return keep;
    };

    const assignGroup = (a: AnchorRef, b: AnchorRef) => {
        const rectA = getAnchorRect(a);
        const rectB = getAnchorRect(b);
        const groupA = rectA?.groupId;
        const groupB = rectB?.groupId;

        let groupId = groupA || groupB;
        if (!groupId) {
            groupId = crypto.randomUUID();
            const color = GROUP_COLORS[paletteIndex % GROUP_COLORS.length];
            setPaletteIndex((i) => (i + 1) % GROUP_COLORS.length);
            updateGroupColor(groupId, color);
        } else if (groupA && groupB && groupA !== groupB) {
            groupId = mergeGroups(groupA, groupB);
        }

        setAnchorGroup(a, groupId);
        setAnchorGroup(b, groupId);
        return groupId;
    };

    const getGroupIdForAnchor = (ref: AnchorRef) => {
        const rect = getAnchorRect(ref);
        return rect?.groupId;
    };

    const cycleGroupForAnchor = (ref: AnchorRef) => {
        const groupId = getGroupIdForAnchor(ref);
        if (!groupId) return;
        const nextColor = GROUP_COLORS[(GROUP_COLORS.indexOf(groupColors[groupId]) + 1 + GROUP_COLORS.length) % GROUP_COLORS.length] || cycleColor();
        updateGroupColor(groupId, nextColor);
    };

    const pruneGroupColors = () => {
        setGroupColors((prev) => {
            const next: Record<string, string> = {};
            Object.entries(prev).forEach(([gid, color]) => {
                const inCards = cards.some((c) => c.groupId === gid);
                const inNodes = flowNodes.some((n) => n.groupId === gid);
                const inEdges = edges.some((e) => e.groupId === gid);
                if (inCards || inNodes || inEdges) {
                    next[gid] = color;
                }
            });
            return next;
        });
    };

    const removeEdgesForAnchor = (ref: AnchorRef) => {
        setEdges((prev) => prev.filter((e) => !(e.from.id === ref.id && e.from.type === ref.type) && !(e.to.id === ref.id && e.to.type === ref.type)));
    };

    const findAnchorAt = (point: Point): AnchorRef | null => {
        const cardHit = cards.find(
            (c) => point.x >= c.x && point.x <= c.x + CARD_WIDTH && point.y >= c.y && point.y <= c.y + CARD_HEIGHT
        );
        if (cardHit) return { type: 'card', id: cardHit.id.toString() };

        const nodeHit = flowNodes.find(
            (n) => point.x >= n.x && point.x <= n.x + n.width && point.y >= n.y && point.y <= n.y + n.height
        );
        if (nodeHit) return { type: 'flow', id: nodeHit.id };
        return null;
    };

    const createEdge = (from: AnchorRef, to: AnchorRef) => {
        const groupId = assignGroup(from, to);
        const color = groupColors[groupId] || cycleColor();
        updateGroupColor(groupId, color);
        applyState({
            edges: [
                ...edges,
                {
                    id: crypto.randomUUID(),
                    from,
                    to,
                    groupId,
                },
            ],
        });
    };

    const handleResizeMove = (event: MouseEvent) => {
        const info = resizingRef.current;
        if (!info) return;
        const dx = (event.clientX - info.startX) / zoomScale;
        const dy = (event.clientY - info.startY) / zoomScale;
        const nextW = Math.max(120, info.width + dx);
        const nextH = Math.max(80, info.height + dy);
        setFlowNodes((prev) =>
            prev.map((n) => (n.id === info.id ? { ...n, width: nextW, height: nextH } : n))
        );
    };

    const handleResizeUp = () => {
        resizingRef.current = null;
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeUp);
        pushHistory(snapshot());
    };

    const handleAnchorClick = (anchor: AnchorRef, event?: React.MouseEvent | React.PointerEvent) => {
        if (mode !== 'connect') return;
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        if (connectingFrom && (connectingFrom.id !== anchor.id || connectingFrom.type !== anchor.type)) {
            createEdge(connectingFrom, anchor);
            setConnectingFrom(null);
            setConnectingPoint(null);
            setHoverAnchor(null);
        } else {
            setConnectingFrom(anchor);
            const center = anchorCenter(anchor);
            if (center) {
                setConnectingPoint({ x: center.x, y: center.y, pressure: 1 });
            }
        }
    };

    const hasContentNear = (x: number, y: number) => {
        const cardHit = cards.some(
            (c) =>
                x >= c.x - contentProximity &&
                x <= c.x + CARD_WIDTH + contentProximity &&
                y >= c.y - contentProximity &&
                y <= c.y + CARD_HEIGHT + contentProximity
        );
        if (cardHit) return true;
        const strokeHit = strokes.some((s) => isPointNearStroke({ x, y, pressure: 1 }, s, contentProximity));
        return strokeHit;
    };

    const centerOn = (worldX: number, worldY: number) => {
        if (!viewport.width || !viewport.height) return;
        setPan({
            x: viewport.width / 2 - worldX * zoomScale,
            y: viewport.height / 2 - worldY * zoomScale,
        });
    };

    const handleMinimapClick = (event: React.MouseEvent<SVGSVGElement>) => {
        if (!constraintsRef.current) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const relX = ((event.clientX - rect.left) / rect.width) * 180;
        const relY = ((event.clientY - rect.top) / rect.height) * 140;
        const worldX = relX * MINIMAP_SCALE;
        const worldY = relY * MINIMAP_SCALE;

        if (!hasContentNear(worldX, worldY)) return;
        centerOn(worldX, worldY);
    };

    const openEditor = (card: Card) => {
        setEditingCard(card);
        setEditTitle(card.title);
        setEditContent(card.content);
        setEditMedia(card.mediaUrl ?? '');
        setEditDoodle(card.doodle ?? []);
    };

    const closeEditor = () => {
        setEditingCard(null);
    };

    const saveEditor = () => {
        if (!editingCard) return;
        const next = cards.map((c) =>
            c.id === editingCard.id
                ? { ...c, title: editTitle, content: editContent, mediaUrl: editMedia || undefined, doodle: editDoodle }
                : c
        );
        applyState({ cards: next });
        setEditingCard(null);
    };

    const isVideoUrl = (url: string) => /\.(mp4|mov|webm)$/i.test(url.trim());

    return (
        <div className={styles.container} ref={constraintsRef}>
            <div className={styles.toolbar}>
                <div className={styles.modeGroup}>
                    <button
                        className={`${styles.modeButton} ${mode === 'move' ? styles.active : ''}`}
                        onClick={() => setMode('move')}
                        title="Move/drag objects"
                    >
                        <Hand size={16} />
                        <span>Move</span>
                    </button>
                    <div className={styles.drawWrapper} onMouseLeave={() => setDrawMenuOpen(false)}>
                        <button
                            className={`${styles.modeButton} ${mode === 'draw' ? styles.active : ''}`}
                            onClick={handleDrawButton}
                            title="Draw with stylus or mouse"
                        >
                            <Pencil size={16} />
                            <span>Draw</span>
                        </button>
                        {drawMenuOpen && (
                            <div className={styles.eraseMenu}>
                                <div className={styles.menuLabel}>Ink size</div>
                                <div className={styles.menuSlider}>
                                    <input
                                        type="range"
                                        min={2}
                                        max={16}
                                        value={baseWidth}
                                        onChange={(e) => setBaseWidth(Number(e.target.value))}
                                    />
                                    <span>{baseWidth}px</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className={styles.eraseWrapper} onMouseLeave={closeEraseMenu}>
                        <button
                            className={`${styles.modeButton} ${mode === 'erase' ? styles.active : ''}`}
                            onClick={handleEraseButton}
                            title="Erase options"
                        >
                            <Eraser size={16} />
                            <span>Erase</span>
                            <span className={styles.eraseHint}>{eraseType === 'stroke' ? 'Strokes' : 'Partial'}</span>
                        </button>
                        {eraseMenuOpen && (
                            <div className={styles.eraseMenu}>
                                <button
                                    className={`${styles.menuItem} ${eraseType === 'stroke' ? styles.menuActive : ''}`}
                                    onClick={() => handleEraseSelect('stroke')}
                                >
                                    Erase strokes (default)
                                </button>
                                <button
                                    className={`${styles.menuItem} ${eraseType === 'partial' ? styles.menuActive : ''}`}
                                    onClick={() => handleEraseSelect('partial')}
                                >
                                    Erase partial (trim under cursor)
                                </button>
                                <div className={styles.menuLabel}>Eraser size</div>
                                <div className={styles.menuSlider}>
                                    <input
                                        type="range"
                                        min={MIN_ERASER_RADIUS}
                                        max={MAX_ERASER_RADIUS}
                                        value={eraserRadius}
                                        onChange={(e) => setEraserRadius(Number(e.target.value))}
                                    />
                                    <span>{eraserRadius}px</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <button
                        className={`${styles.modeButton} ${mode === 'connect' ? styles.active : ''}`}
                        onClick={() => {
                            setMode('connect');
                            setEraseMenuOpen(false);
                            setDrawMenuOpen(false);
                        }}
                        title="Connect nodes"
                    >
                        ↗
                        <span>Connect</span>
                    </button>
                </div>

                <div className={styles.colorGroup}>
                    {strokeColors.map((color) => (
                        <button
                            key={color}
                            className={`${styles.swatch} ${inkColor === color ? styles.swatchActive : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => handleColorSelect(color)}
                            aria-label={`Select color ${color}`}
                        />
                    ))}
                </div>

                <div className={styles.nodePalette}>
                    <span className={styles.paletteLabel}>Nodes</span>
                    <button className={styles.iconButton} onClick={() => handleCreateNode('box')}>Box</button>
                    <button className={styles.iconButton} onClick={() => handleCreateNode('diamond')}>Diamond</button>
                    <button className={styles.iconButton} onClick={() => handleCreateNode('ellipse')}>Ellipse</button>
                </div>

                <div className={styles.actions}>
                    <button className={styles.iconButton} onClick={handleUndo} disabled={historyIndex <= 0}>
                        <Undo2 size={16} />
                        <span>Undo</span>
                    </button>
                    <button className={styles.iconButton} onClick={handleRedo} disabled={!canRedo}>
                        <Undo2 size={16} style={{ transform: 'scaleX(-1)' }} />
                        <span>Redo</span>
                    </button>
                    <button
                        className={styles.iconButton}
                        onClick={handleClear}
                        disabled={!strokes.length && !currentStroke}
                    >
                        <Trash2 size={16} />
                        <span>Clear</span>
                    </button>
                    <div className={styles.zoomGroup}>
                        <button className={styles.iconButton} onClick={zoomOut} title="Zoom out">
                            -
                        </button>
                        <span className={styles.zoomValue}>{Math.round(zoomScale * 100)}%</span>
                        <button className={styles.iconButton} onClick={zoomIn} title="Zoom in">
                            +
                        </button>
                    </div>
                </div>
            </div>

            <div
                className={styles.canvas}
                style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomScale})`, transformOrigin: 'top left' }}
            >
                <svg
                    className={styles.drawingLayer}
                    ref={drawingSurfaceRef}
                    width={PLANE_SIZE}
                    height={PLANE_SIZE}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={finalizeStroke}
                    onPointerCancel={finalizeStroke}
                    onPointerLeave={mode === 'draw' ? finalizeStroke : undefined}
                    style={{ pointerEvents: mode === 'move' ? 'none' : 'auto' }}
                >
                    <defs>
                        <marker
                            id="arrowHead"
                            viewBox="0 0 10 10"
                            refX="10"
                            refY="5"
                            markerWidth="6"
                            markerHeight="6"
                            orient="auto-start-reverse"
                        >
                            <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
                        </marker>
                    </defs>
                    <g className={styles.strokeGroup}>
                        {edges.map((edge) => {
                            const fromCenter = anchorCenter(edge.from);
                            const toCenter = anchorCenter(edge.to);
                            if (!fromCenter || !toCenter) return null;
                            const color = getGroupColor(edge.groupId) || '#94a3b8';
                            return (
                                <line
                                    key={edge.id}
                                    x1={fromCenter.x}
                                    y1={fromCenter.y}
                                    x2={toCenter.x}
                                    y2={toCenter.y}
                                    stroke={color}
                                    strokeWidth={3}
                                    strokeLinecap="round"
                                    markerEnd="url(#arrowHead)"
                                    opacity={0.9}
                                />
                            );
                        })}
                        {connectingFrom && connectingPoint && (
                            <line
                                x1={anchorCenter(connectingFrom)?.x ?? connectingPoint.x}
                                y1={anchorCenter(connectingFrom)?.y ?? connectingPoint.y}
                                x2={connectingPoint.x}
                                y2={connectingPoint.y}
                                stroke="#38bdf8"
                                strokeWidth={2.5}
                                strokeDasharray="6 6"
                                markerEnd="url(#arrowHead)"
                            />
                        )}
                        {strokes.map((stroke) => (
                            <polyline
                                key={stroke.id}
                                points={pointsToString(stroke.points)}
                                stroke={stroke.color}
                                strokeWidth={strokeWidth(stroke)}
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                opacity={
                                    mode === 'erase' && eraseType === 'stroke' && hoveredStrokeId === stroke.id
                                        ? 0.45
                                        : 0.9
                                }
                            />
                        ))}
                        {currentStroke && (
                            <polyline
                                points={pointsToString(currentStroke.points)}
                                stroke={currentStroke.color}
                                strokeWidth={strokeWidth(currentStroke)}
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                opacity={0.6}
                            />
                        )}
                    </g>
                </svg>

            {cards.map((card) => (
                <motion.div
                    key={card.id}
                    className={styles.card}
                        drag={mode === 'move'}
                    dragConstraints={constraintsRef}
                    dragMomentum={false}
                    initial={{ x: card.x, y: card.y }}
                    onDragStart={() => {
                        if (mode !== 'move') return;
                        cardDragStartRef.current = { id: card.id, x: card.x, y: card.y };
                        isDragActiveRef.current = true;
                        if (dragResetTimeoutRef.current) {
                            window.clearTimeout(dragResetTimeoutRef.current);
                            dragResetTimeoutRef.current = null;
                        }
                    }}
                    onDrag={(_, info) => {
                        if (mode !== 'move') return;
                        const start = cardDragStartRef.current;
                        if (!start || start.id !== card.id) return;
                        const dx = info.offset.x / zoomScale;
                        const dy = info.offset.y / zoomScale;
                        setCards((prev) =>
                            prev.map((c) => (c.id === card.id ? { ...c, x: start.x + dx, y: start.y + dy } : c))
                        );
                    }}
                    onDragEnd={(_, info) => {
                        if (mode !== 'move') return;
                        const start = cardDragStartRef.current;
                        const dx = info.offset.x / zoomScale;
                        const dy = info.offset.y / zoomScale;
                        const nextCards = cards.map((c) =>
                            c.id === card.id
                                ? {
                                      ...c,
                                      x: (start ? start.x : c.x) + dx,
                                      y: (start ? start.y : c.y) + dy,
                                  }
                                : c
                        );
                        applyState({ cards: nextCards });
                        cardDragStartRef.current = null;
                        dragResetTimeoutRef.current = window.setTimeout(() => {
                            isDragActiveRef.current = false;
                        }, 120);
                    }}
                    onMouseDown={(e) => {
                        if (mode === 'connect') {
                            handleAnchorClick({ type: 'card', id: card.id.toString() }, e);
                        }
                    }}
                    onClick={() => {
                        if (mode === 'connect' || isDragActiveRef.current) return;
                        openEditor(card);
                    }}
                >
                        <div className={styles.cardHeader} style={card.groupId ? { '--card-accent': getGroupColor(card.groupId) } as React.CSSProperties : undefined}>
                            <span>{card.title}</span>
                            <button
                        className={styles.cardDelete}
                        onClick={(e) => {
                            e.stopPropagation();
                            applyState({ cards: cards.filter((c) => c.id !== card.id) });
                        }}
                                title="Delete sticky"
                            >
                                ×
                            </button>
                            {card.groupId && (
                                <button
                                    className={styles.groupSwatch}
                                    style={{ background: getGroupColor(card.groupId) }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        cycleGroupForAnchor({ type: 'card', id: card.id.toString() });
                                    }}
                                    title="Cycle group color"
                                />
                            )}
                    </div>
                    <div className={styles.cardContent}>
                        {card.content}
                    </div>
                        {card.mediaUrl && (
                            <div className={styles.cardMedia}>
                                {isVideoUrl(card.mediaUrl) ? (
                                    <video src={card.mediaUrl} controls className={styles.cardMediaPreview} />
                                ) : (
                                    <img src={card.mediaUrl} alt={card.title} className={styles.cardMediaPreview} />
                                )}
                            </div>
                        )}
                        <div onMouseDown={(e) => e.stopPropagation()}>
                            <DoodlePad
                                strokes={card.doodle ?? []}
                                color={inkColor}
                                baseWidth={baseWidth}
                                showWhenEmpty={false}
                                onChange={(next) =>
                                    applyState({
                                        cards: cards.map((c) => (c.id === card.id ? { ...c, doodle: next } : c)),
                                    })
                                }
                            />
                        </div>
                </motion.div>
            ))}

                {flowNodes.map((node) => {
                    const color = node.groupId ? getGroupColor(node.groupId) : undefined;
                    const shapeClass =
                        node.type === 'diamond'
                            ? styles.flowDiamond
                            : node.type === 'ellipse'
                                ? styles.flowEllipse
                                : styles.flowBox;
                    const isSelected = selectedFlowId === node.id;
                    return (
                        <motion.div
                            key={node.id}
                            className={`${styles.flowNode} ${shapeClass} ${isSelected ? styles.flowSelected : ''}`}
                            drag={mode === 'move'}
                            dragConstraints={constraintsRef}
                            dragMomentum={false}
                            initial={{ x: node.x, y: node.y }}
                            onDragStart={() => {
                                if (mode !== 'move') return;
                                nodeDragStartRef.current = { id: node.id, x: node.x, y: node.y };
                            }}
                            onDrag={(_, info) => {
                                if (mode !== 'move') return;
                                const start = nodeDragStartRef.current;
                                if (!start || start.id !== node.id) return;
                                const dx = info.offset.x / zoomScale;
                                const dy = info.offset.y / zoomScale;
                                setFlowNodes((prev) =>
                                    prev.map((n) =>
                                        n.id === node.id ? { ...n, x: start.x + dx, y: start.y + dy } : n
                                    )
                                );
                            }}
                            style={{ width: node.width, height: node.height, borderColor: color }}
                            onMouseDown={(e) => {
                                if (mode === 'connect') {
                                    handleAnchorClick({ type: 'flow', id: node.id }, e);
                                } else if (mode === 'move') {
                                    setSelectedFlowId(node.id);
                                }
                            }}
                            onDragEnd={(_, info) => {
                                if (mode !== 'move') return;
                                const start = nodeDragStartRef.current;
                                const dx = info.offset.x / zoomScale;
                                const dy = info.offset.y / zoomScale;
                                const nextNodes = flowNodes.map((n) =>
                                    n.id === node.id
                                        ? {
                                              ...n,
                                              x: (start ? start.x : n.x) + dx,
                                              y: (start ? start.y : n.y) + dy,
                                          }
                                        : n
                                );
                                applyState({ flowNodes: nextNodes });
                                nodeDragStartRef.current = null;
                            }}
                        >
                            <div className={styles.flowHeader}>
                                <span>Node</span>
                                {node.groupId && (
                                    <button
                                        className={styles.groupSwatch}
                                        style={{ background: color }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            cycleGroupForAnchor({ type: 'flow', id: node.id });
                                        }}
                                        title="Cycle group color"
                                    />
                                )}
                                <button
                                    className={styles.cardDelete}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const nextNodes = flowNodes.filter((n) => n.id !== node.id);
                                        const nextEdges = edges.filter(
                                            (edge) =>
                                                !(edge.from.id === node.id && edge.from.type === 'flow') &&
                                                !(edge.to.id === node.id && edge.to.type === 'flow')
                                        );
                                        applyState({ flowNodes: nextNodes, edges: nextEdges });
                                    }}
                                    title="Delete node"
                                >
                                    ×
                                </button>
                            </div>
                            {isSelected ? (
                                <textarea
                                    className={styles.flowEdit}
                                    value={node.text}
                                    onChange={(e) =>
                                        setFlowNodes((prev) =>
                                            prev.map((n) => (n.id === node.id ? { ...n, text: e.target.value } : n))
                                        )
                                    }
                                    onBlur={() => pushHistory(snapshot())}
                                    rows={3}
                                />
                            ) : (
                                <div className={styles.flowBody}>{node.text}</div>
                            )}
                            {isSelected && (
                                <div
                                    className={styles.resizeHandle}
                                    onMouseDown={(e) => {
                                        e.stopPropagation();
                                        resizingRef.current = {
                                            id: node.id,
                                            startX: e.clientX,
                                            startY: e.clientY,
                                            width: node.width,
                                            height: node.height,
                                        };
                                        window.addEventListener('mousemove', handleResizeMove);
                                        window.addEventListener('mouseup', handleResizeUp);
                                    }}
                                />
                            )}
                        </motion.div>
                    );
                })}
            </div>

            <div className={styles.minimap}>
                <svg width="180" height="140" viewBox="0 0 180 140" onClick={handleMinimapClick}>
                    {cards.map((card) => (
                        <rect
                            key={card.id}
                            x={card.x / MINIMAP_SCALE}
                            y={card.y / MINIMAP_SCALE}
                            width={CARD_WIDTH / MINIMAP_SCALE}
                            height={CARD_HEIGHT / MINIMAP_SCALE}
                            rx="2"
                            ry="2"
                            fill="rgba(255,255,255,0.08)"
                            stroke="rgba(255,255,255,0.25)"
                            strokeWidth="0.5"
                        />
                    ))}
                    {flowNodes.map((node) => (
                        <rect
                            key={node.id}
                            x={node.x / MINIMAP_SCALE}
                            y={node.y / MINIMAP_SCALE}
                            width={node.width / MINIMAP_SCALE}
                            height={node.height / MINIMAP_SCALE}
                            rx="2"
                            ry="2"
                            fill="rgba(255,255,255,0.06)"
                            stroke="rgba(255,255,255,0.2)"
                            strokeWidth="0.5"
                        />
                    ))}
                    {strokes.map((stroke) => (
                        <polyline
                            key={stroke.id}
                            points={stroke.points.map((p) => `${p.x / MINIMAP_SCALE},${p.y / MINIMAP_SCALE}`).join(' ')}
                            fill="none"
                            stroke="rgba(255,214,102,0.6)"
                            strokeWidth="1"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity="0.6"
                        />
                    ))}
                    {edges.map((edge) => {
                        const from = anchorCenter(edge.from);
                        const to = anchorCenter(edge.to);
                        if (!from || !to) return null;
                        const color = getGroupColor(edge.groupId) || 'rgba(255,214,102,0.8)';
                        return (
                            <line
                                key={edge.id}
                                x1={from.x / MINIMAP_SCALE}
                                y1={from.y / MINIMAP_SCALE}
                                x2={to.x / MINIMAP_SCALE}
                                y2={to.y / MINIMAP_SCALE}
                                stroke={color}
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                opacity="0.8"
                            />
                        );
                    })}
                    {viewport.width > 0 && viewport.height > 0 && (
                        <rect
                            x={(-pan.x / zoomScale) / MINIMAP_SCALE}
                            y={(-pan.y / zoomScale) / MINIMAP_SCALE}
                            width={(viewport.width / zoomScale) / MINIMAP_SCALE}
                            height={(viewport.height / zoomScale) / MINIMAP_SCALE}
                            fill="none"
                            stroke="rgba(255,214,102,0.7)"
                            strokeWidth="1"
                        />
                    )}
                    <rect
                        x="0.5"
                        y="0.5"
                        width="179"
                        height="139"
                        fill="none"
                        stroke="rgba(255,255,255,0.3)"
                        strokeWidth="1"
                    />
                </svg>
            </div>

            <div className={styles.controls}>
                <button className={styles.fab} title="Add Card" onClick={handleAddCard}>
                    <Plus size={24} />
                </button>
            </div>

            {editingCard && (
                <div className={styles.modalOverlay} onClick={closeEditor}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Edit Sticky</h3>
                            <button className={styles.cardDelete} onClick={closeEditor} aria-label="Close">
                                ×
                            </button>
                        </div>
                        <label className={styles.field}>
                            <span>Title</span>
                            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                        </label>
                        <label className={styles.field}>
                            <span>Text</span>
                            <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={3} />
                        </label>
                        <label className={styles.field}>
                            <span>Image / Video URL</span>
                            <input
                                value={editMedia}
                                onChange={(e) => setEditMedia(e.target.value)}
                                placeholder="https://..."
                            />
                        </label>
                        {editMedia && (
                            <div className={styles.modalPreview}>
                                {isVideoUrl(editMedia) ? (
                                    <video src={editMedia} controls className={styles.modalMedia} />
                                ) : (
                                    <img src={editMedia} alt={editTitle} className={styles.modalMedia} />
                                )}
                            </div>
                        )}
                        <div className={styles.modalSection}>
                            <span className={styles.sectionLabel}>Doodle</span>
                            <DoodlePad strokes={editDoodle} color={inkColor} baseWidth={baseWidth} onChange={setEditDoodle} />
                        </div>
                        <div className={styles.modalActions}>
                            <button className={styles.iconButton} onClick={closeEditor}>
                                Cancel
                            </button>
                            <button className={styles.iconButton} onClick={saveEditor}>
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
