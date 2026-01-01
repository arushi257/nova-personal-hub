'use client';

import { useCallback, useEffect, useState } from 'react';
import styles from './page.module.css';
import { dailyBriefData, techStream, worldStream, longReadStream } from './data';
import { Article, DailyBriefItem, Stream, FilterTime, FilterMode, ImpactLevel } from './types';
import { Bookmark, Layers, Activity, Zap, Shield, Cpu, Globe, BookOpen } from 'lucide-react';

const TIME_FILTERS: FilterTime[] = ['Today', '3D', '7D', 'All'];
const MODE_OPTIONS: FilterMode[] = ['Brief', 'Deep'];

const buildBriefArticle = (item: DailyBriefItem): Article => ({
    id: `brief-${item.id}`,
    headline: item.headline,
    context: item.context,
    tags: item.tags,
    source: item.source || 'Pulse Daily Brief',
    sourceUrl: item.sourceUrl,
    publishedAt: item.publishedAt || new Date().toISOString(),
    energyCost: 'Low'
});

const formatDateMeta = (dateStr: string) => {
    const parsed = new Date(dateStr);
    if (Number.isNaN(parsed.getTime())) return dateStr;
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(parsed);
};

export default function NewsPage() {
    const [timeFilter, setTimeFilter] = useState<FilterTime>('3D'); // Default 3D
    const [mode, setMode] = useState<FilterMode>('Brief'); // Default Brief
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
    const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());
    const [hydrated, setHydrated] = useState(false);
    const savedCount = savedIds.size;

    const toggleSave = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSaved = new Set(savedIds);
        if (newSaved.has(id)) newSaved.delete(id);
        else newSaved.add(id);
        setSavedIds(newSaved);
    };

    useEffect(() => {
        const stored = window.localStorage.getItem('pulse-news-saved');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    setSavedIds(new Set(parsed));
                }
            } catch (error) {
                console.error('Failed to parse saved articles', error);
            }
        }
        setHydrated(true);
    }, []);

    useEffect(() => {
        if (!hydrated) return;
        window.localStorage.setItem('pulse-news-saved', JSON.stringify(Array.from(savedIds)));
    }, [hydrated, savedIds]);

    // Filter Logic
    const filterArticles = useCallback((articles: Article[], options: { disableTimeFilter?: boolean } = {}) => {
        const now = new Date();
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);

        const threeDaysAgo = new Date(now);
        threeDaysAgo.setDate(now.getDate() - 3);

        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);

        const shouldApplyTimeFilter = timeFilter !== 'All' && !options.disableTimeFilter;

        const passesTimeWindow = (article: Article) => {
            const pubDate = new Date(article.publishedAt);
            if (Number.isNaN(pubDate.getTime())) return true;
            if (timeFilter === 'Today') return pubDate >= startOfToday;
            if (timeFilter === '3D') return pubDate >= threeDaysAgo;
            if (timeFilter === '7D') return pubDate >= sevenDaysAgo;
            return true;
        };

        const filtered = shouldApplyTimeFilter ? articles.filter(passesTimeWindow) : articles;

        return [...filtered].sort((a, b) => {
            // Sort by Relevance (Impact) then Date
            const impactScore = (lvl?: ImpactLevel) => lvl === 'High' ? 3 : lvl === 'Medium' ? 2 : 1;
            const scoreA = impactScore(a.impactLevel);
            const scoreB = impactScore(b.impactLevel);

            if (scoreA !== scoreB) return scoreB - scoreA;
            return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        });
    }, [timeFilter]);

    useEffect(() => {
        const streams = [
            { stream: techStream, options: {} },
            { stream: worldStream, options: {} },
            { stream: longReadStream, options: { disableTimeFilter: true } }
        ];
        const filteredOrdered = streams.flatMap(({ stream, options }) => filterArticles(stream.articles, options));
        if (filteredOrdered.length === 0) return;
        if (selectedArticle && filteredOrdered.some(article => article.id === selectedArticle.id)) return;
        setSelectedArticle(filteredOrdered[0]);
    }, [filterArticles, selectedArticle]);

    // Opacity helper
    const getOpacity = (dateStr: string) => {
        const hoursAgo = (new Date().getTime() - new Date(dateStr).getTime()) / (1000 * 60 * 60);
        if (hoursAgo < 24) return 1;
        if (hoursAgo < 48) return 0.85;
        if (hoursAgo < 72) return 0.7;
        return 0.5; // > 3 days
    };

    return (
        <div className={styles.container}>
            {/* A. Header Bar */}
            <header className={styles.header}>
                <div className={styles.titleSection}>
                    <h1 className={styles.title}>PULSE NEWS</h1>
                    <span className={styles.subtext}>Filtered. Contextual. Useful.</span>
                </div>

                <div className={styles.controls}>
                    {/* Time Filter */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {TIME_FILTERS.map(t => (
                            <button
                                key={t}
                                className={`${styles.filterToggle} ${timeFilter === t ? styles.activeControl : ''}`}
                                onClick={() => setTimeFilter(t)}
                                aria-pressed={timeFilter === t}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    {/* Mode Toggle */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {MODE_OPTIONS.map(m => (
                            <button
                                key={m}
                                className={`${styles.modeToggle} ${mode === m ? styles.activeControl : ''}`}
                                onClick={() => setMode(m)}
                                aria-pressed={mode === m}
                            >
                                {m}
                            </button>
                        ))}
                    </div>

                    <div
                        className={styles.saveIcon}
                        title={`${savedCount} saved article${savedCount === 1 ? '' : 's'}`}
                        aria-label={`${savedCount} saved article${savedCount === 1 ? '' : 's'}`}
                    >
                        <Bookmark size={20} />
                        <span className={styles.saveCount}>{savedCount}</span>
                    </div>
                </div>
            </header>

            <main className={styles.mainContent}>
                <div className={styles.feedSection}>
                    {/* B. Daily Brief (Always visible, filtered by 3D logic usually or just top items) */}
                    <section className={styles.briefSection}>
                        <div className={styles.briefHeader}>
                            <Zap size={16} />
                            <span>5-Minute Brief</span>
                        </div>
                        <div className={styles.briefGrid}>
                            {dailyBriefData.map(item => (
                                <div key={item.id} className={styles.briefCard} onClick={() => setSelectedArticle(buildBriefArticle(item))}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                                        {item.headline}
                                    </h3>
                                    <p style={{ fontSize: '0.9rem', color: '#A0A0A0', lineHeight: 1.4 }}>
                                        {item.context}
                                    </p>
                                    <div className={styles.cardMeta} style={{ marginTop: '1rem' }}>
                                        {item.tags.map(tag => (
                                            <span key={tag} className={styles.tag}>{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* C. Streams */}
                    <StreamSection
                        stream={techStream}
                        articles={filterArticles(techStream.articles)}
                        mode={mode}
                        onSelect={setSelectedArticle}
                        savedIds={savedIds}
                        onSave={toggleSave}
                        getOpacity={getOpacity}
                        icon={<Cpu size={20} color="#00E5FF" />}
                    />
                    <StreamSection
                        stream={worldStream}
                        articles={filterArticles(worldStream.articles)}
                        mode={mode}
                        onSelect={setSelectedArticle}
                        savedIds={savedIds}
                        onSave={toggleSave}
                        getOpacity={getOpacity}
                        icon={<Globe size={20} color="#FF6D00" />}
                    />
                    <StreamSection
                        stream={longReadStream}
                        articles={filterArticles(longReadStream.articles, { disableTimeFilter: true })}
                        mode={mode}
                        onSelect={setSelectedArticle}
                        savedIds={savedIds}
                        onSave={toggleSave}
                        getOpacity={getOpacity}
                        icon={<BookOpen size={20} color="#AE81FF" />}
                    />

                </div>

                {/* D. AI Context Panel (Fixed Floating Drawer) */}
                <aside className={styles.contextPanel}>
                    {selectedArticle ? (
                        <div key={selectedArticle.id} className={styles.panelContent}>
                            <div className={styles.panelHeader}>
                                Intelligence Layer
                            </div>
                            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', lineHeight: 1.4 }}>
                                {selectedArticle.headline}
                            </h2>

                            {/* Deep Dive Data */}
                            {selectedArticle.deepDive ? (
                                <>
                                    <div className={styles.panelSection}>
                                        <div className={styles.panelTitle}>WHAT'S REALLY GOING ON</div>
                                        <p className={styles.panelText}>{selectedArticle.deepDive.whatHappened}</p>
                                    </div>
                                    <div className={styles.panelSection}>
                                        <div className={styles.panelTitle}>WHAT CHANGED</div>
                                        <p className={styles.panelText}>{selectedArticle.deepDive.whatChanged}</p>
                                    </div>
                                    <div className={styles.panelSection}>
                                        <div className={styles.panelTitle}>POSSIBLE OUTCOMES</div>
                                        <ul style={{ paddingLeft: '1rem', color: '#CCC', fontSize: '0.9rem', margin: 0 }}>
                                            {selectedArticle.deepDive.futureOutcomes.map((o, i) => (
                                                <li key={i} style={{ marginBottom: '0.4rem' }}>{o}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className={styles.panelSection}>
                                        <div className={styles.panelTitle}>BIAS CHECK</div>
                                        <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', borderLeft: '3px solid #FF00FF' }}>
                                            <p className={styles.panelText} style={{ fontSize: '0.85rem' }}>{selectedArticle.deepDive.biasCheck}</p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className={styles.panelSection}>
                                    <div className={styles.panelTitle}>CONTEXT</div>
                                    <p className={styles.panelText}>
                                        {selectedArticle.context}
                                    </p>
                                    <p className={styles.panelText} style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '1rem' }}>
                                        Full analysis available for articles with AI deep dive data.
                                    </p>
                                </div>
                            )}

                            <div className={styles.panelActions}>
                                {selectedArticle.sourceUrl && (
                                    <a
                                        href={selectedArticle.sourceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.readOriginalBtn}
                                    >
                                        Read Original →
                                    </a>
                                )}
                                <button
                                    className={`${styles.saveToForgeBtn} ${savedIds.has(selectedArticle.id) ? styles.saved : ''}`}
                                    onClick={() => {
                                        const newSaved = new Set(savedIds);
                                        if (newSaved.has(selectedArticle.id)) {
                                            newSaved.delete(selectedArticle.id);
                                        } else {
                                            newSaved.add(selectedArticle.id);
                                        }
                                        setSavedIds(newSaved);
                                    }}
                                >
                                    {savedIds.has(selectedArticle.id) ? '✓ Saved' : 'Save to Forge'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.emptyPanel}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                <Layers size={40} strokeWidth={1} />
                                <p>Select an article to activate<br />Intelligence Layer</p>
                            </div>
                        </div>
                    )}
                </aside>
            </main>
        </div>
    );
}

// Sub-component for rendering a stream list
function StreamSection({
    stream,
    articles,
    mode,
    onSelect,
    savedIds,
    onSave,
    getOpacity,
    icon
}: {
    stream: Stream;
    articles: Article[];
    mode: FilterMode;
    onSelect: (a: Article) => void;
    savedIds: Set<string>;
    onSave: (id: string, e: React.MouseEvent) => void;
    getOpacity: (date: string) => number;
    icon?: React.ReactNode;
}) {
    if (articles.length === 0) return null; // Hide empty streams

    return (
        <section className={styles.streamSection}>
            <div className={styles.streamTitle}>
                {icon}
                {stream.title}
            </div>
            <div className={styles.cardGrid}>
                {articles.map(article => (
                    <div
                        key={article.id}
                        className={`${styles.newsCard} ${mode === 'Deep' ? styles.deepCard : ''}`}
                        onClick={() => onSelect(article)}
                        style={{ opacity: getOpacity(article.publishedAt) }}
                    >
                        <div className={styles.cardContent}>
                            <div className={styles.cardHeadline}>{article.headline}</div>
                            <div className={styles.cardContext}>{article.context}</div>

                            {/* Deep Mode Content */}
                            {mode === 'Deep' && article.deepContent && (
                                <div className={styles.deepContentStub}>
                                    <div className={styles.biasBadge} title="Bias Indicator">
                                        <Activity size={12} /> {article.deepContent.biasIndicator}
                                        <span style={{ opacity: 0.5, marginLeft: '5px' }}>| Hype: {article.deepContent.hypeScore}/10</span>
                                    </div>
                                    {article.deepContent.explanation.map((para, i) => (
                                        <p key={i} className={styles.deepParagraph}>{para}</p>
                                    ))}
                                    <div className={styles.sourceRef}>
                                        Source: {article.deepContent.credibleSourceNote}
                                    </div>
                                </div>
                            )}

                            <div className={styles.cardMeta}>
                                <span className={styles.tag} style={{
                                    border: '1px solid #333',
                                    background: 'transparent'
                                }}>
                                    {article.energyCost} Energy
                                </span>
                                {article.tags.map(tag => (
                                    <span key={tag} className={styles.tag}>{tag}</span>
                                ))}
                                <span className={styles.sourceMeta}>
                                    {article.sourceUrl ? (
                                        <a
                                            href={article.sourceUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className={styles.sourceLink}
                                        >
                                            {article.source}
                                        </a>
                                    ) : (
                                        article.source
                                    )}
                                    {' • '}
                                    {formatDateMeta(article.publishedAt)}
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                            {article.impactLevel && (
                                <div
                                    className={`${styles.impactMeter} ${article.impactLevel === 'High' ? styles.impactHigh :
                                            article.impactLevel === 'Medium' ? styles.impactMed : styles.impactLow
                                        }`}
                                    title={`Impact: ${article.impactLevel}`}
                                />
                            )}
                            <button
                                onClick={(e) => onSave(article.id, e)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: savedIds.has(article.id) ? '#FF6D00' : '#444'
                                }}
                            >
                                <Bookmark size={18} fill={savedIds.has(article.id) ? '#FF6D00' : 'none'} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
