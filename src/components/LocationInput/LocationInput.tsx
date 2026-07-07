// src/components/LocationInput/LocationInput.tsx
// Reusable autocomplete city input backed by Nominatim.
// Uses a React Portal for the dropdown to avoid clipping issues.

import { useState, useRef, useCallback, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { searchPlaces } from '../../api/geocoding';
import type { GeoResult } from '../../types';
import styles from './LocationInput.module.css';

interface Props {
  placeholder?: string;
  value: string;
  onSelect: (result: GeoResult) => void;
  onChange?: (raw: string) => void;
}

const DEBOUNCE_MS = 380;

export function LocationInput({ placeholder = 'Search city…', value, onSelect, onChange }: Props) {
  const [inputVal, setInputVal] = useState(value);
  const [results, setResults]   = useState<GeoResult[]>([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inputWrapRef = useRef<HTMLDivElement>(null);

  // Sync external value changes
  useEffect(() => {
    if (value !== inputVal) {
      setInputVal(value);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Update dropdown position when results change or window resizes
  const updatePosition = useCallback(() => {
    if (inputWrapRef.current && results.length > 0) {
      const rect = inputWrapRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
        zIndex: 9999, // ensures it sits above everything
      });
    }
  }, [results.length]);

  useEffect(() => {
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [updatePosition]);

  const handleInput = useCallback((raw: string) => {
    setInputVal(raw);
    onChange?.(raw);
    clearTimeout(timerRef.current);
    if (raw.trim().length < 2) { setResults([]); return; }
    timerRef.current = setTimeout(async () => {
      const res = await searchPlaces(raw);
      setResults(res);
      setActiveIdx(-1);
    }, DEBOUNCE_MS);
  }, [onChange]);

  const handleSelect = useCallback((r: GeoResult) => {
    setInputVal(r.label);
    setResults([]);
    onSelect(r);
  }, [onSelect]);

  const handleKey = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (!results.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); handleSelect(results[activeIdx]); }
    else if (e.key === 'Escape') setResults([]);
  }, [results, activeIdx, handleSelect]);

  const renderDropdown = () => {
    if (results.length === 0) return null;
    return createPortal(
      <ul className={styles.dropdown} role="listbox" style={dropdownStyle}>
        {results.map((r, i) => (
          <li
            key={r.placeId}
            role="option"
            aria-selected={i === activeIdx}
            className={`${styles.item} ${i === activeIdx ? styles.itemActive : ''}`}
            onMouseDown={() => handleSelect(r)}
            title={r.label}
          >
            <span className={styles.itemIcon}>📍</span>
            <span className={styles.itemLabel}>{r.label}</span>
          </li>
        ))}
      </ul>,
      document.body
    );
  };

  return (
    <div className={styles.wrap} ref={inputWrapRef}>
      <input
        className={styles.input}
        type="text"
        autoComplete="off"
        spellCheck={false}
        placeholder={placeholder}
        value={inputVal}
        onChange={(e) => handleInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => setTimeout(() => setResults([]), 200)}
        aria-autocomplete="list"
        aria-expanded={results.length > 0}
      />
      {renderDropdown()}
    </div>
  );
}
