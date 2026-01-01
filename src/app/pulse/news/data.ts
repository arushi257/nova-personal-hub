import { Article, DailyBriefItem, Stream } from './types';

// Helper to get date string relative to now
const now = new Date();
const daysAgo = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
};

export const dailyBriefData: DailyBriefItem[] = [
    {
        id: 'db1',
        headline: 'OpenAI shifts model release strategy',
        context: 'Moving from "release early" to "release when safe" affects API costs + open-source momentum.',
        tags: ['AI', 'Tech', 'Strategy'],
        source: 'OpenAI Blog',
        sourceUrl: 'https://openai.com/blog',
        publishedAt: daysAgo(0)
    },
    {
        id: 'db2',
        headline: 'India releases draft AI regulation framework',
        context: 'Focuses on harm prevention rather than innovation restrictions. Startups need compliance checks.',
        tags: ['India', 'Policy', 'AI'],
        source: 'MeitY',
        sourceUrl: 'https://meity.gov.in',
        publishedAt: daysAgo(1)
    },
    {
        id: 'db3',
        headline: 'SpaceX Starship achieves orbit',
        context: 'Proven heavy-lift capability changes cost models for LEO deployment roughly 10x.',
        tags: ['Space', 'Tech'],
        source: 'SpaceX',
        sourceUrl: 'https://spacex.com/vehicles/starship',
        publishedAt: daysAgo(0)
    }
];

export const techStream: Stream = {
    id: 'tech',
    title: 'Tech & Science',
    articles: [
        {
            id: 't1',
            headline: 'Gemini 1.5 Pro Context Window Expanded',
            context: '1M+ tokens allows entire codebases in prompt. Shifts engineering from RAG to long-context.',
            tags: ['AI', 'LLMs'],
            source: 'Google DeepMind',
            sourceUrl: 'https://deepmind.google/technologies/gemini/',
            publishedAt: daysAgo(0), // Today
            energyCost: 'Medium',
            deepDive: {
                whatHappened: 'Gemini 1.5 Pro now supports 1M+ token context window in production.',
                whatChanged: 'Previously limited to 32k/128k. RAG was mandatory for large docs. Now context stuffing is viable.',
                futureOutcomes: ['RAG vector DB market cools down', 'New class of "whole-repo" coding agents'],
                biasCheck: 'Tech-optimist hype vs infrastructure reality cost.'
            },
            deepContent: {
                explanation: [
                    "Google's release of the 1M+ token context window represents a fundamental shift in how we approach LLM application architecture. Previously, 'Retriever-Augmented Generation' (RAG) was the standard for handling large datasets—chunking data, embedding it, and retrieving relevant snippets. This was complex and lossy.",
                    "With 1M+ tokens, developers can often dump entire manuals, codebases, or legal contracts directly into the prompt. The model can reason across the *entire* context without retrieval errors. This simplifies the stack but increases inference costs significantly.",
                    "The trade-off is now latency vs. complexity. While RAG remains faster for specific queries, long-context models offer superior reasoning over holistic data."
                ],
                biasIndicator: "Tech-Optimist",
                hypeScore: 8,
                credibleSourceNote: "Confirmed by official API release notes and developer benchmarks."
            }
        },
        {
            id: 't2',
            headline: 'React Compiler (Forget) enters beta',
            context: 'Automatic memoization removes need for useMemo/useCallback. DX simplification.',
            tags: ['CS', 'Frontend'],
            source: 'React Team',
            sourceUrl: 'https://react.dev/blog',
            publishedAt: daysAgo(1), // Yesterday (3D filter)
            energyCost: 'Low',
            deepContent: {
                explanation: [
                    "React Compiler (formerly React Forget) automates the manual memoization developers have struggled with for years. It uses a custom Babel plugin to analyze the component graph and inject `useMemo` and `useCallback` equivalents at build time.",
                    "This solves the 're-render hell' problem where parent updates cause cascading renders in children. It makes React performant by default, lowering the skill floor for writing optimized apps.",
                ],
                biasIndicator: "Neutral",
                hypeScore: 5,
                credibleSourceNote: "Beta release available in Next.js canary."
            }
        },
        {
            id: 't3',
            headline: 'CISA warns of active exploitation of Ivanti VPN',
            context: 'Zero-day used to breach critical infrastructure. Patching window closed weeks ago.',
            tags: ['Security', 'Infosec'],
            source: 'CISA',
            sourceUrl: 'https://www.cisa.gov/news-events/alerts',
            publishedAt: daysAgo(4), // 4 days ago (7D filter)
            energyCost: 'Medium',
            deepContent: {
                explanation: [
                    "A critical zero-day vulnerability in Ivanti Connect Secure VPNs differs from standard CVEs because it allows unauthenticated remote code execution. Attackers can bypass MFA and gain full system access.",
                    "CISA has issued an emergency directive requiring federal agencies to disconnect these devices immediately. This severity indicates active, widespread exploitation by nation-state actors."
                ],
                biasIndicator: "High-Severity Warning",
                hypeScore: 2,
                credibleSourceNote: "CISA Emergency Directive 24-01."
            }
        }
    ]
};

export const worldStream: Stream = {
    id: 'world',
    title: 'World & India',
    articles: [
        {
            id: 'w1',
            headline: 'RBI tightens unsecured lending norms',
            context: 'Risk weights increased for consumer credit. Fintech valuations likely to correct.',
            tags: ['India', 'Economy', 'Fintech'],
            source: 'RBI Circular',
            sourceUrl: 'https://rbi.org.in/scripts/NotificationUser.aspx',
            publishedAt: daysAgo(2), // 2 days ago (3D filter)
            energyCost: 'High',
            impactLevel: 'High',
            deepDive: {
                whatHappened: 'RBI increased risk weights on unsecured consumer loans by 25%.',
                whatChanged: 'Ends the "growth at all costs" era for lending apps.',
                futureOutcomes: ['BNPL consolidations', 'Higher interest rates for personal loans'],
                biasCheck: 'Regulatory prudence vs Growth dampening.'
            },
            deepContent: {
                explanation: [
                    "The Reserve Bank of India (RBI) has raised risk weights on unsecured consumer credit from 100% to 125%. This effectively means banks must set aside more capital for every rupee lent to personal loan borrowers or credit card users.",
                    "This move is a direct signal to cool down the overheating unsecured lending market, which has seen 20-30% year-on-year growth. It targets the 'fintech model' of small-ticket, high-volume loans.",
                    "Expect immediate interest rate hikes for personal loans and a squeeze on 'Buy Now Pay Later' providers who rely on bank funding."
                ],
                biasIndicator: "Regulatory Conservative",
                hypeScore: 3,
                credibleSourceNote: "Official RBI Circular DOD.No.12/2024."
            }
        },
        {
            id: 'w2',
            headline: 'EU AI Act final text approved',
            context: 'First comprehensive AI law. Tiered risk approach. Compliance burden heavy for foundation models.',
            tags: ['World', 'Policy'],
            source: 'European Parliament',
            sourceUrl: 'https://www.europarl.europa.eu/news/en/press-room',
            publishedAt: daysAgo(6), // 6 days ago (7D filter)
            energyCost: 'High',
            impactLevel: 'High',
            deepContent: {
                explanation: [
                    "The EU AI Act classifies AI systems by risk: 'Unacceptable' (banned, like social scoring), 'High Risk' (strictly regulated, like medical AI), and 'General Purpose' (transparency requirements).",
                    "This creates the 'Brussels Effect'—global tech companies will likely standardize on these rules to maintain access to the EU market. However, open-source advocates argue the compliance costs could stifle European startups compared to US/China."
                ],
                biasIndicator: "Policy Analysis",
                hypeScore: 6,
                credibleSourceNote: "European Parliament Press Release."
            }
        }
    ]
};

export const longReadStream: Stream = {
    id: 'long',
    title: 'Curiosity & Deep Dives',
    articles: [
        {
            id: 'l1',
            headline: 'The scaling laws of biology',
            context: 'Why mice live 2 years and elephants 70. Universal constants in metabolic rates.',
            tags: ['Science', 'Biology'],
            source: 'Quanta Magazine',
            sourceUrl: 'https://www.quantamagazine.org',
            publishedAt: daysAgo(10), // 10 days ago (Filtered out by 7D!)
            energyCost: 'Low',
            deepContent: {
                explanation: [
                    "Kleiber's Law states that an animal's metabolic rate scales to the 3/4 power of the animal's mass. This effectively means larger animals are more efficient energy users per gram of tissue.",
                    "This scaling law applies from bacteria to whales and even extends to city infrastructure and corporate growth. It suggests fundamental physical constraints on how complex systems organize energy."
                ],
                biasIndicator: "Scientific Fact",
                hypeScore: 1,
                credibleSourceNote: "Quanta Magazine / SFI Research."
            }
        },
        {
            id: 'l2',
            headline: 'How TCP/IP won the protocol wars',
            context: 'The history of the OSI model vs the practical internet. "Rough consensus and running code".',
            tags: ['History', 'CS'],
            source: 'IETF Journal',
            sourceUrl: 'https://www.ietf.org/about/participate/get-started/',
            publishedAt: daysAgo(3), // 3 days ago (7D filter)
            energyCost: 'Medium',
            deepContent: {
                explanation: [
                    "In the 1980s, the official standard for networking was the OSI model, backed by governments and huge telcos. But TCP/IP, a scrappy project from DARPA/universities, won because it shipped working code first.",
                    "The philosophy of 'rough consensus and running code' allowed the internet to evolve rapidly, unlike the committee-designed OSI. This is a classic lesson in 'worse is better' and the power of open standards."
                ],
                biasIndicator: "Historical Analysis",
                hypeScore: 2,
                credibleSourceNote: "IETF Archives."
            }
        }
    ]
};
