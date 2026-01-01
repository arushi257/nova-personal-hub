'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './page.module.css';
import { BrainlyTeaser, brainlyTeasers } from '@/data/brainly-teasers';

const fallbackTeaser: BrainlyTeaser = {
  date: '2025-12-21',
  title: 'Consecutive Double Letters 2',
  category: 'Language',
  description: 'Fill in the blanks to find words that have two sets of double letters in a row.',
  source: 'Braingle Daily Brain Teaser',
  isDaily: true,
  clues: [
    {
      prompt: 'A woodwind instrument that dates back to the mid 16th century.',
      pattern: 'B_____N',
      tier: 'Main'
    },
    {
      prompt: 'A sweet treat that is sometimes made with nuts or raisins.',
      pattern: 'T____E',
      tier: 'Main'
    },
    {
      prompt: 'A term that can be used to describe boats and ships.',
      pattern: 'K_______S',
      tier: 'Main'
    },
    {
      prompt: 'A character in a courtroom.',
      pattern: 'A______E',
      tier: 'Main'
    },
    {
      prompt: 'A Belgian language.',
      pattern: 'W_____N',
      tier: 'Expert'
    },
    {
      prompt: 'This word has 3 consecutive double letters!',
      pattern: 'B________R',
      tier: 'Fun'
    }
  ]
};

const sortTeasers = (teasers: BrainlyTeaser[]) =>
  [...teasers].sort((a, b) => a.date.localeCompare(b.date));

const MAX_HISTORY = 6;

export default function TeasersPage() {
  const sortedEntries = useMemo(() => sortTeasers(brainlyTeasers).reverse(), []);
  const categories = useMemo(() => {
    const unique = new Set<string>();
    sortedEntries.forEach((entry) => {
      if (entry.category) {
        unique.add(entry.category);
      }
    });
    return ['All', ...unique];
  }, [sortedEntries]);

  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showDailyOnly, setShowDailyOnly] = useState(true);
  const [selectedDate, setSelectedDate] = useState(sortedEntries[0]?.date ?? fallbackTeaser.date);
  const [cluesVisible, setCluesVisible] = useState(true);

  const filteredHistory = useMemo(() => {
    return sortedEntries.filter((entry) => {
      const matchesCategory =
        categoryFilter === 'All' || entry.category === categoryFilter;
      const matchesDaily = !showDailyOnly || Boolean(entry.isDaily);
      return matchesCategory && matchesDaily;
    });
  }, [sortedEntries, categoryFilter, showDailyOnly]);

  const heroCandidates = filteredHistory.length ? filteredHistory : sortedEntries;

  useEffect(() => {
    const isSelectedVisible = heroCandidates.some((entry) => entry.date === selectedDate);
    if (!isSelectedVisible) {
      setSelectedDate(heroCandidates[0]?.date ?? fallbackTeaser.date);
    }
  }, [heroCandidates, selectedDate]);

  const selectedTeaser = useMemo(
    () =>
      brainlyTeasers.find((item) => item.date === selectedDate) ?? fallbackTeaser,
    [selectedDate]
  );

  const recentList = filteredHistory.slice(0, MAX_HISTORY);
  const hasNoHistory = filteredHistory.length === 0;
  const clueCount = selectedTeaser.clues.length;

  const toggleView = (dailyOnly: boolean) => {
    setShowDailyOnly(dailyOnly);
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.sectionLabel}>Ember · Curiosity Lab</p>
        <h1 className={styles.pageTitle}>Brainly teasers</h1>
        <p className={styles.pageSubtitle}>
          Fresh content from the Braingle email feed, sorted by category with a dedicated daily view.
        </p>
      </header>

      <div className={styles.grid}>
        <section className={styles.heroCard}>
          <div className={styles.heroMeta}>
            <span className={styles.metaChip}>{selectedTeaser.category}</span>
            <span className={styles.metaChip}>{selectedTeaser.date}</span>
            {selectedTeaser.isDaily && (
              <span className={styles.dailyBadge}>Daily feed</span>
            )}
          </div>
          <div className={styles.heroContent}>
            <h2 className={styles.heroTitle}>{selectedTeaser.title}</h2>
            <p className={styles.heroDescription}>{selectedTeaser.description}</p>
          </div>
          <div className={styles.clueControls}>
            <button
              type="button"
              className={styles.toggleButton}
              onClick={() => setCluesVisible((prev) => !prev)}
            >
              {cluesVisible ? 'Hide clues' : `Show ${clueCount} clues`}
            </button>
            <span className={styles.clueCount}>{clueCount} clues</span>
          </div>
          {cluesVisible && (
            <ul className={styles.clueList}>
              {selectedTeaser.clues.map((clue, index) => (
                <li key={`${clue.prompt}-${index}`} className={styles.clueCard}>
                  <div className={styles.clueHeader}>
                    <span className={styles.clueNumber}>#{index + 1}</span>
                    <span className={styles.clueTier}>{clue.tier || 'Core'}</span>
                  </div>
                  <p className={styles.cluePrompt}>{clue.prompt}</p>
                  <div className={styles.patternRow}>
                    <span className={styles.patternLabel}>Blank</span>
                    <span className={styles.patternValue}>{clue.pattern || '—'}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className={styles.historyCard}>
          <div className={styles.historyHeader}>
            <h3>Recent teasers</h3>
            <p>Filter by category or view only the daily drop.</p>
          </div>

          <div className={styles.filterPanel}>
            <div className={styles.filterRow}>
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`${styles.filterChip} ${
                    categoryFilter === category ? styles.filterChipActive : ''
                  }`}
                  onClick={() => setCategoryFilter(category)}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className={styles.viewToggle}>
              <button
                type="button"
                className={`${styles.viewButton} ${
                  showDailyOnly ? styles.viewButtonActive : ''
                }`}
                onClick={() => toggleView(true)}
              >
                Daily teasers
              </button>
              <button
                type="button"
                className={`${styles.viewButton} ${
                  !showDailyOnly ? styles.viewButtonActive : ''
                }`}
                onClick={() => toggleView(false)}
              >
                All teasers
              </button>
            </div>
          </div>

          <ul className={styles.historyList}>
            {hasNoHistory ? (
              <p className={styles.emptyState}>
                There aren’t any teasers that match those filters yet.
              </p>
            ) : (
              recentList.map((entry) => (
                <li key={entry.date}>
                  <button
                    type="button"
                    className={`${styles.historyItem} ${
                      selectedDate === entry.date ? styles.activeHistory : ''
                    }`}
                    onClick={() => setSelectedDate(entry.date)}
                  >
                    <div className={styles.historyRow}>
                      <span className={styles.historyDate}>{entry.date}</span>
                      {entry.isDaily && (
                        <span className={styles.historyDaily}>Daily</span>
                      )}
                    </div>
                    <span className={styles.historyTitle}>{entry.title}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </aside>
      </div>
    </div>
  );
}
