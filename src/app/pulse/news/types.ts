export type EnergyCost = 'Low' | 'Medium' | 'High';
export type ImpactLevel = 'Low' | 'Medium' | 'High';

export interface Article {
    id: string;
    headline: string;
    context: string; // "Why it matters" or 2-line explainer
    tags: string[];
    source: string;
    sourceUrl?: string; // External link
    publishedAt: string;
    energyCost: EnergyCost;
    impactLevel?: ImpactLevel; // For World & India stream

    // AI Context Panel Data (Sidebar)
    deepDive?: {
        whatHappened: string;
        whatChanged: string; // vs last time
        futureOutcomes: string[];
        biasCheck: string; // left/right, hype level
    };

    // Deep Mode Data (Inline)
    deepContent?: {
        explanation: string[]; // 2-3 paragraphs
        biasIndicator: string; // e.g., "Left-leaning", "Hype-heavy"
        hypeScore: number; // 1-10
        credibleSourceNote: string;
    };
}

export interface Stream {
    id: string;
    title: string;
    description?: string;
    articles: Article[];
}

export interface DailyBriefItem {
    id: string;
    headline: string;
    context: string;
    tags: string[];
    source?: string;
    sourceUrl?: string;
    publishedAt?: string;
}

export type FilterTime = 'Today' | '3D' | '7D' | 'All';
export type FilterMode = 'Brief' | 'Deep';

export interface UserPreferences {
    mutedTopics: string[];
    favoriteTopics: string[];
}
