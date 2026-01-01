#!/usr/bin/env node
/**
 * Scrape JustinGuitar beginner course pages for module titles/links and lesson data
 * Extracts data from the embedded JSON store in the grade pages
 * Writes to src/data/justinguitar-modules.json
 */
const fs = require('fs/promises');
const path = require('path');
const puppeteer = require('puppeteer');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'src/data/justinguitar-modules.json');
const BASE = 'https://www.justinguitar.com';

// Course page URLs from the JustinGuitar website
const grades = [
    { 
        id: 'grade-1', 
        title: 'Grade 1', 
        url: `${BASE}/classes/beginner-guitar-course-grade-one`,
        categoryUrl: `${BASE}/categories/beginner-guitar-lessons-grade-1`
    },
    { 
        id: 'grade-2', 
        title: 'Grade 2', 
        url: `${BASE}/classes/beginner-guitar-course-grade-two`,
        categoryUrl: `${BASE}/categories/beginner-guitar-lessons-grade-2`
    },
    { 
        id: 'grade-3', 
        title: 'Grade 3', 
        url: `${BASE}/classes/beginner-guitar-course-grade-three`,
        categoryUrl: `${BASE}/categories/beginner-guitar-lessons-grade-3`
    },
    { 
        id: 'grade-4', 
        title: 'Grade 4', 
        url: `${BASE}/classes/intermediate-guitar-course-grade-four`,
        categoryUrl: `${BASE}/categories/beginner-guitar-lessons-grade-4`
    },
    { 
        id: 'grade-5', 
        title: 'Grade 5', 
        url: `${BASE}/classes/intermediate-guitar-course-grade-five`,
        categoryUrl: `${BASE}/categories/beginner-guitar-lessons-grade-5`
    },
    { 
        id: 'grade-6', 
        title: 'Grade 6', 
        url: `${BASE}/classes/intermediate-guitar-course-grade-six`,
        categoryUrl: `${BASE}/categories/beginner-guitar-lessons-grade-6`
    },
    { 
        id: 'grade-7', 
        title: 'Grade 7', 
        url: `${BASE}/classes/advanced-guitar-course-grade-seven`,
        categoryUrl: `${BASE}/categories/intermediate-guitar-lessons-grade-7`
    }
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const readExisting = async () => {
    try {
        const raw = await fs.readFile(OUTPUT, 'utf8');
        return JSON.parse(raw);
    } catch {
        return [];
    }
};

const scrapeGrade = async (page, grade) => {
    console.log(`📖 Scraping ${grade.title} from ${grade.url}`);
    
    await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36'
    );
    await page.setViewport({ width: 1280, height: 900 });
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9'
    });

    await page.goto(grade.url, { waitUntil: 'networkidle2', timeout: 60000 });
    await sleep(2000);

    // Extract data from the embedded JSON store - including lessons
    const result = await page.evaluate((baseUrl) => {
        const modules = [];
        
        // Find the JSON data store embedded in the page
        const jsonScript = document.querySelector('script[data-js-react-store="parentGroupStore"]');
        
        if (jsonScript) {
            try {
                const data = JSON.parse(jsonScript.textContent);
                
                // Get the group order from parentGroup attributes
                const groupOrder = data.parentGroup?.data?.attributes?.groupOrder || [];
                
                // The groups data contains all modules
                const groupsData = data.groups?.data || [];
                
                // The parentGroup.included has both groups and lessons
                const included = data.parentGroup?.included || [];
                
                // Build a map of all lessons by ID
                const lessonMap = new Map();
                included.forEach((item) => {
                    if (item.type === 'lesson') {
                        const attrs = item.attributes || {};
                        lessonMap.set(parseInt(item.id, 10), {
                            title: attrs.title || '',
                            slug: attrs.slug || '',
                            youtubeId: attrs.youtubeId || attrs.youtube_id || attrs.videoId || ''
                        });
                    }
                });
                
                // Create a map of group id to group data with lessons
                const groupMap = new Map();
                groupsData.forEach((group) => {
                    const attrs = group.attributes || {};
                    const id = parseInt(group.id, 10);
                    const title = attrs.title || '';
                    const slug = attrs.slug || '';
                    const lessonOrder = attrs.lessonOrder || [];
                    
                    // Filter out Nitsuj (left-handed practice) modules, ukulele, and bass
                    if (title && slug && 
                        !title.toLowerCase().includes('nitsuj') &&
                        !title.toLowerCase().includes('ukulele') &&
                        !title.toLowerCase().includes('bass')) {
                        
                        // Get lessons for this module in order
                        const lessons = [];
                        lessonOrder.forEach((lessonId) => {
                            const lesson = lessonMap.get(lessonId);
                            if (lesson && lesson.title) {
                                lessons.push({
                                    title: lesson.title,
                                    url: lesson.slug ? `${baseUrl}/guitar-lessons/${lesson.slug}` : '',
                                    youtubeId: lesson.youtubeId,
                                    youtubeUrl: lesson.youtubeId ? `https://www.youtube.com/watch?v=${lesson.youtubeId}` : ''
                                });
                            }
                        });
                        
                        groupMap.set(id, {
                            title: title,
                            url: `${baseUrl}/modules/${slug}`,
                            slug: slug,
                            lessons: lessons
                        });
                    }
                });
                
                // Sort modules according to groupOrder
                if (groupOrder.length > 0) {
                    groupOrder.forEach((groupId) => {
                        const module = groupMap.get(groupId);
                        if (module) {
                            modules.push(module);
                        }
                    });
                } else {
                    // Fallback: just use the order from groupsData
                    groupMap.forEach((module) => {
                        modules.push(module);
                    });
                }
            } catch (e) {
                console.error('Failed to parse JSON store:', e);
            }
        }
        
        return modules;
    }, BASE);

    console.log(`  Found ${result.length} modules`);
    
    // Count and log lessons
    let totalLessons = 0;
    result.forEach((module, i) => {
        const lessonCount = module.lessons?.length || 0;
        totalLessons += lessonCount;
        console.log(`    ${i + 1}. ${module.title} (${lessonCount} lessons)`);
    });
    console.log(`  Total: ${totalLessons} lessons`);
    
    return { 
        id: grade.id, 
        title: grade.title, 
        url: grade.categoryUrl,
        modules: result 
    };
};

const main = async () => {
    console.log('🎸 Starting JustinGuitar scraper...\n');
    
    const existing = await readExisting();
    const byId = Object.fromEntries(existing.map((g) => [g.id, g]));

    const browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-web-security'
        ]
    });

    const page = await browser.newPage();

    const results = [];
    for (const grade of grades) {
        try {
            const data = await scrapeGrade(page, grade);
            const fallback = byId[grade.id]?.modules ?? [];
            
            if (data.modules.length > 0) {
                results.push(data);
                console.log(`  ✅ ${grade.id}: ${data.modules.length} modules saved\n`);
            } else if (fallback.length > 0) {
                results.push({ ...data, modules: fallback });
                console.log(`  ⚠️ ${grade.id}: Using existing ${fallback.length} modules\n`);
            } else {
                results.push(data);
                console.log(`  ❌ ${grade.id}: No modules found\n`);
            }
        } catch (err) {
            console.error(`❌ ${grade.id}: ${err.message}\n`);
            results.push({ 
                id: grade.id,
                title: grade.title,
                url: grade.categoryUrl,
                modules: byId[grade.id]?.modules ?? [] 
            });
        }
        await sleep(2000 + Math.random() * 1500);
    }

    await browser.close();

    await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
    await fs.writeFile(OUTPUT, JSON.stringify(results, null, 2));
    console.log(`\n✅ Wrote ${OUTPUT}`);
    
    // Summary
    console.log('\n📊 Summary:');
    let totalLessons = 0;
    let totalYoutubeLinks = 0;
    results.forEach((r) => {
        let lessonCount = 0;
        let ytCount = 0;
        r.modules.forEach((m) => {
            lessonCount += m.lessons?.length || 0;
            m.lessons?.forEach((l) => {
                if (l.youtubeId) ytCount++;
            });
        });
        totalLessons += lessonCount;
        totalYoutubeLinks += ytCount;
        console.log(`   ${r.title}: ${r.modules.length} modules, ${lessonCount} lessons, ${ytCount} YouTube links`);
    });
    console.log(`\n   Total: ${totalLessons} lessons, ${totalYoutubeLinks} YouTube links`);
};

main().catch((err) => {
    console.error(err);
    process.exit(1);
});




