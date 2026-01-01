# Nova Personal Hub

A futuristic personal command center built on **Next.js 16** and **React 19**. Structured as a modular dashboard with the **Nexus** home and four specialized wings: **Ember**, **Quark**, **Pulse**, and **Forge**.

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Production build
npm run build && npm start
```

The app runs at `http://localhost:3000`.

### Requirements

- Node 20+
- npm or compatible package manager

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── ember/              # Curiosity & learning wing
│   ├── quark/              # Productivity tools wing
│   ├── pulse/              # Life metrics wing
│   ├── forge/              # Creative studio wing
│   └── wings/              # Wing launcher page
├── components/             # Reusable UI components
│   ├── layout/             # TopNav, Sidebar, LayoutWrapper
│   ├── nexus/              # Dashboard widgets
│   ├── ember/              # Books, Movies components
│   └── quark/              # Pomodoro helpers
└── data/                   # Static data files
```

## Wings & Features

### Nexus (Home)

A cosmic bridge into every wing. `src/app/page.tsx` layers the welcome status cards, live clock, ambient starfield, and quick launcher with `DaySnapshot`, while the sidebar surface houses:

- **Theme toggle** backed by `ThemeContext` so the Sun/Moon toggle persists the preferred palette.
- **Feature Flags panel** (`components/nexus/FeatureFlagsPanel.tsx`) that fetches remote flags, supports search by name/key, shows owner/last update, and lets you toggle states with optimistic updates + error handling.
- **Services panel** (`components/nexus/ServicesPanel.tsx`) that lists service health, colors statuses, refreshes on demand, and lets you confirm deploy/restart actions per service.
- **Quick Launcher + Ambient Background** for fast wing navigation inside a glassy canvas.

### Wings (Launcher)

`/wings` surfaces the same Ember/Quark/Pulse/Forge navigation in an icon-driven grid grouped by wing color, making it easy to jump between modules without nesting through the sidebar.

### Ember — Curiosity Lab

#### Guitar

- Guitar Grades 1–9 catalog (hero grade, highlights, module/lesson links, song hub, and tool shortcuts).
- Built-in metronome (40–220 BPM), tap tempo, floating action links, and persistence of last-open grade using `localStorage`.
- Practice tools include linked metronome, tuner, chord library, and song directory buttons.

#### Books

- Shelf model with universes, series, drag-and-drop reordering, and stats panels for read/unread counts.
- Add/update books via modals that auto-fetch Open Library metadata (author, cover, genre) and support statuses, ratings, quotes, notes, tags, and series transfers.
- Filters include search, tag chips, drag-shelf deletion, and offline persistence keys for both data and shelf order.

#### Visuals

- Franchise/collection architecture with OMDb-powered search (enter your API key once), preview cards, ratings, watched toggles, and notes.
- Cards support image/video attachments and manual entry when the search misses.
- Mini search + filter toolbar, watchlist status badges, and modal detail views with watch/delete/move controls.

#### Brain Teasers

- Daily Braingle imports (`src/data/brainly-teasers.ts`) rendered with hero clue list, toggleable clue deck, and recent history.
- Category filters, “daily only” toggle, and sticky history list highlight the freshest puzzles.

### Quark — Productivity Core

#### Pomodoro

- Multi-mode timer (focus/short break/long break) with SVG ring, floating orb mascot, ambient sound selectors, and sparkles on completion.
- Settings sidebar persists focus/short/long durations, auto-start toggles, and sound preference in `localStorage`.
- Local notifications use the Web Audio API/Notification API to celebrate sessions and count completed pomodoros with manual reset.

#### Todo

- List/board/timeline switcher with filter pills (timeframe, department), sorting, and custom property definitions persisted via `localStorage`.
- Property manager modal lets you add/edit/remove statuses, selects, dates, and more, while tasks keep historical notes with timestamped entries.
- Detail drawer surfaces stats for each task, plus a notes composer, and the board/timeline views sync with the same task store on `/lib/quark/todoStore`.

#### Calendar

- Year/month/day views with interactive months ➜ month/day view wiring, adding events (title/time/location/description), and hourly timelines.
- Connects to the same `notion-tasks` store as the todo board, highlights overdue days, and broadcasts custom events to keep views in sync.

### Pulse — Life Metrics

#### Habits

- Daily/metric/anti-habits with streak tracking, wizard-based add/edit flow, note modal, and pinboard split (daily tasks, metrics, anti-habits).
- Analytics toggle between charts, heatmaps, and annual calendar grids for quick streak checking.

#### Finances

- Summary strip + category chips, month selector, and lightweight filters that power feed and budget tiles.
- Add-expense modal validates amounts/dates while manage modal rewrites budgets/categories/subscriptions, includes auto-allocate, archive vault, and balance-adjust modals.
- Chart toggles (line/area/pie) powered by Recharts, plus feed filters, inline search, and recurring subscription controls with archival workflow.

#### Travel

- Trip planner that records segments, itineraries, attachments (image/video/pdf), world clocks, and moods per trip.
- Toolbar filters (search/status/sort) let you switch between list/timeline views, while the sidebar mini-map, mini calendar, and clock grid keep reference data in view.
- Drawer keeps live trip notes, segments, itinerary entries, attachments, and mood/status controls; new trips auto-create calendar highlights.

#### News

- Saved article tracking persists in `localStorage` with bookmark counts.
- Time filters (Today, 3D, 7D, All), mode toggle (Brief/Deep), and curated streams (tech/world/long read) keep the feed fresh.
- Intelligence panel surfaces AI context/deep dive copy (what changed, possible outcomes, bias checks) plus “Save to Forge” CTA and energy cost tags.

### Forge — Creative Studio

#### Ideas

- Infinite board with draggable cards, flow nodes, connectors, doodle pad, minimap, undo/redo, persistent pan/zoom, grouping colors, and local storage of strokes/board state.
- Mode toolbar toggles drawing, erasing, connecting, and moving; cards support attached media, doodles, and editable content via modal.

#### Notes

- Notion-style editor with page tree/folder nesting, slash commands, formatting toolbar, outline, drag-drop tree sorting, folder colors, history snapshots, and `localStorage` persistence.

#### Sheet

- Lightweight spreadsheet grid that stores data locally, supports keyboard navigation (arrows/Enter/Tab), adding rows/columns, clearing/resetting, import/export JSON, and keeps row/column counts visible.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | Run ESLint |
| `npm run test:nexus` | Execute the Nexus component smoke test suite |
| `npm run scrape-justinguitar` | Fetch JustinGuitar module data → `src/data/justinguitar-modules.json` |
| `npm run fetch-teaser` | Fetch daily Braingle teaser → `src/data/brainly-teasers.json` |
| `node scripts/update-news.js` | Refresh Pulse news streams with RSS + optional Gemini analysis → `src/app/pulse/news/data.ts` |

### Pulse News Automation

`node scripts/update-news.js` crawls the RSS feeds listed inside `scripts/update-news.js`, optionally enriches each article with the free Gemini API (set `GEMINI_API_KEY` in your `.env.local`), and writes the generated streams to `src/app/pulse/news/data.ts`. Run it manually whenever you want fresh Pulse content, or schedule it (cron/CI/vercel) to keep the news dashboard up to date.

Also see the same script's header for a recommended cron line and tips for handling the Gemini key.

### Teaser Automation Setup

To fetch brain teasers from Gmail:

1. Enable IMAP in Gmail settings
2. Create an app password: Google Account → Security → App passwords
3. Add credentials to `.env.local`:

  ```ini
  GMAIL_EMAIL=you@example.com
  GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
  ```

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **UI**: React 19, CSS Modules, Sass
- **Animation**: Framer Motion
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Scraping**: Puppeteer (for JustinGuitar data)
- **Email**: imap-simple, mailparser (for teasers)

## Architecture

### Styling
- Global theming in `src/app/globals.css`
- Per-component CSS Modules
- `.glass-panel` utility for translucent card backgrounds

### State Management
- Client components with `useState`/`useEffect`
- `localStorage` persistence for todos, calendar events, notes, and canvas strokes
- Mock data patterns ready for API integration

### Layout System
- `LayoutWrapper` coordinates TopNav, Sidebar, and main content
- Sidebar dynamically adapts per wing, supports pin/collapse (60px–250px)
- Responsive design throughout

## Known Issues

- `npm audit` may report vulnerabilities; run `npm audit fix --force` if needed before deployment
- Canvas animations are client-only with SSR hydration guards

## License

Private project — not for redistribution.
