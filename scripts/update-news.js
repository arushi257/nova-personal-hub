#!/usr/bin/env node
/**
 * News Update Script
 * 
 * Fetches RSS feeds, optionally runs AI analysis, and updates the news data file.
 * 
 * Usage:
 *   node scripts/update-news.js
 * 
 * Environment variables:
 *   GEMINI_API_KEY - Optional. If set, enables AI-powered summaries and analysis.
 *                    Get a FREE key at: https://aistudio.google.com/apikey
 * 
 * To run daily, add to cron:
 *   0 6 * * * cd /path/to/mewebapp && node scripts/update-news.js >> logs/news.log 2>&1
 * 
 * Or use Vercel Cron (vercel.json):
 *   { "crons": [{ "path": "/api/news/fetch", "schedule": "0 6 * * *" }] }
 */

const fs = require('fs');
const path = require('path');

// RSS Feed sources
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
    ],
};

// Simple XML parser for RSS
function parseRSSItems(xml, sourceName, category) {
    const items = [];
    const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/gi) || [];
    
    for (const itemXml of itemMatches.slice(0, 5)) {
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
async function fetchFeed(feed) {
    try {
        const response = await fetch(feed.url, {
            headers: { 'User-Agent': 'PulseNewsBot/1.0' },
        });
        
        if (!response.ok) {
            console.error(`❌ Failed to fetch ${feed.name}: ${response.status}`);
            return [];
        }
        
        const xml = await response.text();
        const items = parseRSSItems(xml, feed.name, feed.category);
        console.log(`✓ ${feed.name}: ${items.length} items`);
        return items;
    } catch (error) {
        console.error(`❌ Error fetching ${feed.name}:`, error.message);
        return [];
    }
}

// AI Analysis using Google Gemini (FREE)
async function analyzeWithAI(items) {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        console.log('\n⚠️  No GEMINI_API_KEY found. Using basic processing (no AI analysis).');
        console.log('   Get a FREE key at: https://aistudio.google.com/apikey\n');
        return items.map((item, index) => ({
            id: `rss-${Date.now()}-${index}`,
            headline: item.title,
            context: item.description || 'No summary available.',
            tags: [item.category],
            source: item.source,
            sourceUrl: item.link,
            publishedAt: item.pubDate ? new Date(item.pubDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            energyCost: 'Medium',
        }));
    }
    
    console.log('\n🤖 Running AI analysis with Gemini...');
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
            const error = await response.text();
            throw new Error(`Gemini API error: ${response.status} - ${error}`);
        }
        
        const data = await response.json();
        let analysisText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
        
        // Clean up response (remove markdown code blocks if present)
        analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        let analyses = [];
        try {
            analyses = JSON.parse(analysisText);
            console.log(`✓ AI analyzed ${analyses.length} articles`);
        } catch (parseError) {
            console.error('❌ Failed to parse AI response:', parseError.message);
            console.log('Raw response:', analysisText.slice(0, 200));
        }
        
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
        console.error('❌ AI analysis failed:', error.message);
        return items.map((item, index) => ({
            id: `rss-${Date.now()}-${index}`,
            headline: item.title,
            context: item.description || 'No summary available.',
            tags: [item.category],
            source: item.source,
            sourceUrl: item.link,
            publishedAt: item.pubDate ? new Date(item.pubDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            energyCost: 'Medium',
        }));
    }
}

// Generate the TypeScript data file
function generateDataFile(articles, dailyBrief) {
    const techArticles = articles.filter(a => 
        a.tags.some(t => ['Tech', 'AI', 'CS', 'Frontend', 'Security', 'LLMs', 'Infosec'].includes(t))
    ).slice(0, 8);
    
    const worldArticles = articles.filter(a => 
        a.tags.some(t => ['World', 'India', 'Policy', 'Economy', 'Fintech', 'Business'].includes(t))
    ).slice(0, 8);
    
    const scienceArticles = articles.filter(a => 
        a.tags.some(t => ['Science', 'Biology', 'Physics', 'History', 'Research'].includes(t))
    ).slice(0, 5);

    const content = `// AUTO-GENERATED by scripts/update-news.js
// Last updated: ${new Date().toISOString()}
// Do not edit manually - changes will be overwritten

import { Article, DailyBriefItem, Stream } from './types';

export const dailyBriefData: DailyBriefItem[] = ${JSON.stringify(dailyBrief, null, 4)};

export const techStream: Stream = {
    id: 'tech',
    title: 'Tech & Science',
    articles: ${JSON.stringify(techArticles, null, 4)}
};

export const worldStream: Stream = {
    id: 'world',
    title: 'World & India',
    articles: ${JSON.stringify(worldArticles, null, 4)}
};

export const longReadStream: Stream = {
    id: 'long',
    title: 'Curiosity & Deep Dives',
    articles: ${JSON.stringify(scienceArticles, null, 4)}
};
`;

    return content;
}

async function main() {
    console.log('📰 Pulse News Updater\n');
    console.log('Fetching RSS feeds...\n');
    
    const allFeeds = [
        ...RSS_FEEDS.tech,
        ...RSS_FEEDS.world,
        ...RSS_FEEDS.india,
        ...RSS_FEEDS.science,
    ];
    
    // Fetch all feeds
    const results = await Promise.all(allFeeds.map(fetchFeed));
    const allItems = results.flat();
    
    console.log(`\n📊 Total items fetched: ${allItems.length}`);
    
    // Sort by date
    allItems.sort((a, b) => {
        const dateA = new Date(a.pubDate || 0).getTime();
        const dateB = new Date(b.pubDate || 0).getTime();
        return dateB - dateA;
    });
    
    // Take top 30 and analyze
    const topItems = allItems.slice(0, 30);
    const processedArticles = await analyzeWithAI(topItems);
    
    // Generate daily brief (top 3)
    const dailyBrief = processedArticles.slice(0, 3).map(a => ({
        id: a.id,
        headline: a.headline,
        context: a.context,
        tags: a.tags,
        source: a.source,
        sourceUrl: a.sourceUrl,
        publishedAt: a.publishedAt,
    }));
    
    // Generate and write data file
    const dataContent = generateDataFile(processedArticles, dailyBrief);
    const dataPath = path.join(__dirname, '../src/app/pulse/news/data.ts');
    
    fs.writeFileSync(dataPath, dataContent, 'utf-8');
    console.log(`\n✅ Updated: ${dataPath}`);
    console.log(`   - ${dailyBrief.length} daily brief items`);
    console.log(`   - ${processedArticles.length} total articles`);
    console.log(`\n🎉 Done! News data is now up to date.`);
}

main().catch(console.error);

