// src/components/WeatherWidget/WeatherStrip.tsx
// Compact 5-day horizontal forecast strip for the route detail panel.

import type { DayForecast } from '../../types';
import styles from './WeatherWidget.module.css';

function shortDate(dateStr: string): string {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const [, m, d] = dateStr.split('-');
  return `${months[parseInt(m) - 1]} ${parseInt(d)}`;
}

interface Props { forecasts: DayForecast[]; days?: number; }

export function WeatherStrip({ forecasts, days = 5 }: Props) {
  if (!forecasts.length) return <p className={styles.loading}>🌡️ Loading weather…</p>;
  return (
    <div className={styles.strip}>
      {forecasts.slice(0, days).map((day) => (
        <div key={day.date} className={styles.stripDay}>
          <span className={styles.stripDate}>{shortDate(day.date)}</span>
          <span className={styles.stripIcon}>{day.icon}</span>
          <span className={styles.stripHi}>{day.maxTemp}°</span>
          <span className={styles.stripLo}>{day.minTemp}°</span>
        </div>
      ))}
    </div>
  );
}
