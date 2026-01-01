'use server';

import { NextResponse } from 'next/server';

// RSS Feed sources - customize these to your interests
const RSS_FEEDS = {
    tech: [
        { name: 'Hacker News', url: 'https://hnrss.org/frontpage', category: 'Tech' },
        { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/technology-lab', category: 'Tech' },
        { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'Tech' },
    ],
    world: [
        { name: 'Reuters World', url: 'https://feeds.reuters.com/Reuters/worldNews', category: 'World' },
        { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', category: 'World' },
    ],
    india: [
        { name: 'The Hindu', url: 'https://www.thehindu.com/news/national/feeder/default.rss', category: 'India' },
        { name: 'Economic Times', url: 'https://economictimes.indiatimes.com/rssfeedsdefault.cms', category: 'India' },
    ],
    science: [
        { name: 'Quanta Magazine', url: 'https://www.quantamagazine.org/feed/', category: 'Science' },
        { name: 'Nature News', url: 'https://www.nature.com/nature.rss', category: 'Science' },
    ],
};

interface RSSItem {
    title: string;
    link: string;
    pubDate: string;
    description: string;
    source: string;
    category: string;
}

interface ProcessedArticle {
    id: string;
    headline: string;
    context: string;
    tags: string[];
    source: string;
    sourceUrl: string;
    publishedAt: string;
    energyCost: 'Low' | 'Medium' | 'High';
    impactLevel?: 'Low' | 'Medium' | 'High';
    deepContent?: {
        explanation: string[];
        biasIndicator: string;
        hypeScore: number;
        credibleSourceNote: string;
    };
}

// Simple XML parser for RSS (no external deps)
function parseRSSItems(xml: string, sourceName: string, category: string): RSSItem[] {
    const items: RSSItem[] = [];
    const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/gi) || [];
    
    for (const itemXml of itemMatches.slice(0, 5)) { // Limit to 5 per feed
        const title = itemXml.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i)?.[1] || '';
        const link = itemXml.match(/<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/i)?.[1] || '';
        const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/i)?.[1] || '';
        const description = itemXml.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1] || '';
        
        if (title && link) {
            items.push({
                title: title.replace(/<[^>]*>/g, '').trim(),
                link: link.trim(),
                pubDate,
                description: description.replace(/<[^>]*>/g, '').trim().slice(0, 300),
                source: sourceName,
                category,
            });
        }
    }
    
    return items;
}

// Fetch a single RSS feed
async function fetchFeed(feed: { name: string; url: string; category: string }): Promise<RSSItem[]> {
    try {
        const response = await fetch(feed.url, {
            headers: { 'User-Agent': 'PulseNewsBot/1.0' },
            next: { revalidate: 3600 }, // Cache for 1 hour
        });
        
        if (!response.ok) {
            console.error(`Failed to fetch ${feed.name}: ${response.status}`);
            return [];
        }
        
        const xml = await response.text();
        return parseRSSItems(xml, feed.name, feed.category);
    } catch (error) {
        console.error(`Error fetching ${feed.name}:`, error);
        return [];
    }
}

// AI Analysis using Google Gemini (FREE - requires GEMINI_API_KEY env var)
// Get a free key at: https://aistudio.google.com/apikey
async function analyzeWithAI(items: RSSItem[]): Promise<ProcessedArticle[]> {
    const apiKey = process.env.GEMINI_API_KEY;
    
    // If no API key, return basic processing without AI
    if (!apiKey) {
        return items.map((item, index) => ({
            id: `rss-${Date.now()}-${index}`,
            headline: item.title,
            context: item.description || 'No summary available.',
            tags: [item.category],
            source: item.source,
            sourceUrl: item.link,
            publishedAt: item.pubDate ? new Date(item.pubDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            energyCost: 'Medium' as const,
        }));
    }
    
    // With AI: batch analyze headlines for context
    const headlines = items.map(i => `[${i.source}] ${i.title}`).join('\n');
    
    const prompt = `You are a news analyst. For each headline below, provide a JSON array with objects containing:
- "context": A 1-2 sentence "why it matters" explanation
- "tags": Array of 2-3 relevant tags (e.g., ["AI", "Tech", "Business"])
- "energyCost": Reading effort - "Low" (quick read), "Medium" (5-10 min), "High" (deep dive)
- "impactLevel": "Low", "Medium", or "High" based on significance
- "biasIndicator": Brief note on perspective (e.g., "Tech-optimist", "Policy-focused", "Neutral")
- "hypeScore": 1-10 rating of hype vs substance

Return ONLY a valid JSON array, no markdown formatting, no code blocks.

Analyze these ${items.length} headlines:

${headlines}`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.3,
                        maxOutputTokens: 4000,
                    },
                }),
            }
        );
        
        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }
        
        const data = await response.json();
        let analysisText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
        
        // Clean up response (remove markdown code blocks if present)
        analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        // Parse AI response
        let analyses: Array<{
            context: string;
            tags: string[];
            energyCost: 'Low' | 'Medium' | 'High';
            impactLevel: 'Low' | 'Medium' | 'High';
            biasIndicator: string;
            hypeScore: number;
        }> = [];
        
        try {
            analyses = JSON.parse(analysisText);
        } catch {
            console.error('Failed to parse AI response:', analysisText);
        }
        
        // Merge AI analysis with original items
        return items.map((item, index) => {
            const analysis = analyses[index] || {};
            return {
                id: `rss-${Date.now()}-${index}`,
                headline: item.title,
                context: analysis.context || item.description || 'No summary available.',
                tags: analysis.tags || [item.category],
                source: item.source,
                sourceUrl: item.link,
                publishedAt: item.pubDate ? new Date(item.pubDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                energyCost: analysis.energyCost || 'Medium',
                impactLevel: analysis.impactLevel,
                deepContent: analysis.biasIndicator ? {
                    explanation: [analysis.context || item.description],
                    biasIndicator: analysis.biasIndicator,
                    hypeScore: analysis.hypeScore || 5,
                    credibleSourceNote: `Via ${item.source}`,
                } : undefined,
            };
        });
    } catch (error) {
        console.error('AI analysis failed:', error);
        // Fallback to basic processing
        return items.map((item, index) => ({
            id: `rss-${Date.now()}-${index}`,
            headline: item.title,
            context: item.description || 'No summary available.',
            tags: [item.category],
            source: item.source,
            sourceUrl: item.link,
            publishedAt: item.pubDate ? new Date(item.pubDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            energyCost: 'Medium' as const,
        }));
    }
}

export async function GET() {
    const allFeeds = [
        ...RSS_FEEDS.tech,
        ...RSS_FEEDS.world,
        ...RSS_FEEDS.india,
        ...RSS_FEEDS.science,
    ];
    
    // Fetch all feeds in parallel
    const feedPromises = allFeeds.map(fetchFeed);
    const results = await Promise.all(feedPromises);
    const allItems = results.flat();
    
    // Sort by date (newest first)
    allItems.sort((a, b) => {
        const dateA = new Date(a.pubDate || 0).getTime();
        const dateB = new Date(b.pubDate || 0).getTime();
        return dateB - dateA;
    });
    
    // Take top 30 items and run AI analysis
    const topItems = allItems.slice(0, 30);
    const processedArticles = await analyzeWithAI(topItems);
    
    // Group by category for the streams
    const techArticles = processedArticles.filter(a => a.tags.some(t => ['Tech', 'AI', 'CS', 'Frontend', 'Security'].includes(t)));
    const worldArticles = processedArticles.filter(a => a.tags.some(t => ['World', 'India', 'Policy', 'Economy'].includes(t)));
    const scienceArticles = processedArticles.filter(a => a.tags.some(t => ['Science', 'Biology', 'Physics', 'History'].includes(t)));
    
    return NextResponse.json({
        success: true,
        fetchedAt: new Date().toISOString(),
        articleCount: processedArticles.length,
        streams: {
            tech: techArticles.slice(0, 10),
            world: worldArticles.slice(0, 10),
            longRead: scienceArticles.slice(0, 5),
        },
        dailyBrief: processedArticles.slice(0, 3).map(a => ({
            id: a.id,
            headline: a.headline,
            context: a.context,
            tags: a.tags,
            source: a.source,
            sourceUrl: a.sourceUrl,
            publishedAt: a.publishedAt,
        })),
    });
}

