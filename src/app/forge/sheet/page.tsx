'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, Trash2 } from 'lucide-react';
import styles from './page.module.css';

type Grid = string[][];

const STORAGE_KEY = 'forge-sheet-data';
const DEFAULT_ROWS = 6;
const DEFAULT_COLS = 5;

function createGrid(rows: number, cols: number): Grid {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => ''));
}

export default function SheetPage() {
  const [grid, setGrid] = useState<Grid>(() => createGrid(DEFAULT_ROWS, DEFAULT_COLS));

  // Hydrate from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setGrid(parsed);
      }
    } catch {
      // ignore bad data
    }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(grid));
  }, [grid]);

  const rowCount = grid.length;
  const colCount = grid[0]?.length ?? 0;

  const columnLabels = useMemo(
    () =>
      Array.from({ length: colCount }, (_, idx) => {
        // Spreadsheet-style labels: A, B, ... Z, AA, AB ...
        let n = idx;
        let label = '';
        do {
          label = String.fromCharCode(65 + (n % 26)) + label;
          n = Math.floor(n / 26) - 1;
        } while (n >= 0);
        return label;
      }),
    [colCount]
  );

  const updateCell = (r: number, c: number, value: string) => {
    setGrid((prev) => prev.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? value : cell)) : row)));
  };

  const addRow = () => setGrid((prev) => [...prev, Array.from({ length: colCount }, () => '')]);

  const addColumn = () =>
    setGrid((prev) => prev.map((row) => [...row, '']));

  const resetGrid = () => {
    if (!window.confirm('Reset grid to default size? This clears all values.')) return;
    setGrid(createGrid(DEFAULT_ROWS, DEFAULT_COLS));
  };

  const clearValues = () => {
    if (!window.confirm('Clear all cell values?')) return;
    setGrid((prev) => prev.map((row) => row.map(() => '')));
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(grid)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'forge-sheet.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importJson = () => {
    const text = window.prompt('Paste grid JSON to import');
    if (!text) return;
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.every((row: unknown) => Array.isArray(row))) {
        setGrid(parsed);
      } else {
        alert('Invalid grid format.');
      }
    } catch (err) {
      alert('Could not parse JSON.');
    }
  };

  const focusCell = (r: number, c: number) => {
    const el = document.querySelector<HTMLInputElement>(`[data-cell="${r}-${c}"]`);
    if (el) {
      el.focus();
      el.select();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, r: number, c: number) => {
    const { key, shiftKey } = e;
    if (key === 'Enter') {
      e.preventDefault();
      focusCell(shiftKey ? Math.max(0, r - 1) : Math.min(rowCount - 1, r + 1), c);
      return;
    }
    if (key === 'ArrowDown') {
      e.preventDefault();
      focusCell(Math.min(rowCount - 1, r + 1), c);
      return;
    }
    if (key === 'ArrowUp') {
      e.preventDefault();
      focusCell(Math.max(0, r - 1), c);
      return;
    }
    if (key === 'ArrowLeft') {
      e.preventDefault();
      focusCell(r, Math.max(0, c - 1));
      return;
    }
    if (key === 'ArrowRight') {
      e.preventDefault();
      focusCell(r, Math.min(colCount - 1, c + 1));
      return;
    }
    if (key === 'Tab') {
      e.preventDefault();
      const flatIndex = r * colCount + c + (shiftKey ? -1 : 1);
      const bounded = Math.max(0, Math.min(rowCount * colCount - 1, flatIndex));
      const nextRow = Math.floor(bounded / colCount);
      const nextCol = bounded % colCount;
      focusCell(nextRow, nextCol);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Forge / Sheet</p>
          <h1 className={styles.title}>Sheet</h1>
          <p className={styles.subtitle}>Lightweight grid for quick tabular notes.</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.button} onClick={addRow}>
            <Plus size={16} />
            Row
          </button>
          <button className={styles.button} onClick={addColumn}>
            <Plus size={16} />
            Column
          </button>
          <button className={styles.buttonGhost} onClick={clearValues}>
            <Trash2 size={16} />
            Clear cells
          </button>
          <button className={styles.buttonGhost} onClick={resetGrid}>
            <RefreshCw size={16} />
            Reset grid
          </button>
          <button className={styles.buttonGhost} onClick={exportJson}>
            ⬇
            Export
          </button>
          <button className={styles.buttonGhost} onClick={importJson}>
            ⬆
            Import
          </button>
        </div>
      </header>

      <div className={styles.sheet}>
        <div className={styles.headerRow}>
          <div className={styles.corner} />
          {columnLabels.map((label) => (
            <div key={label} className={styles.colHeader}>
              {label}
            </div>
          ))}
        </div>
        <div className={styles.body}>
          {grid.map((row, rIdx) => (
            <div key={`row-${rIdx}`} className={styles.row}>
              <div className={styles.rowHeader}>{rIdx + 1}</div>
              {row.map((cell, cIdx) => (
                <input
                  key={`cell-${rIdx}-${cIdx}`}
                  className={styles.cell}
                  value={cell}
                  onChange={(e) => updateCell(rIdx, cIdx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, rIdx, cIdx)}
                  placeholder="—"
                  data-cell={`${rIdx}-${cIdx}`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className={styles.meta}>
          <span>{rowCount} rows</span>
          <span>·</span>
          <span>{colCount} columns</span>
        </div>
      </div>
    </div>
  );
}

