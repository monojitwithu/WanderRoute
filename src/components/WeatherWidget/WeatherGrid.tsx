// src/components/WeatherWidget/WeatherGrid.tsx
// Full 7-day weather grid for the stop detail view.

import type { DayForecast } from '../../types';
import styles from './WeatherWidget.module.css';

function formatShortDate(dateStr: string): { dow: string; date: string } {
  const days   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const d = new Date(dateStr + 'T00:00:00');
  return { dow: days[d.getDay()], date: `${months[d.getMonth()]} ${d.getDate()}` };
}

interface Props { 
  forecasts: DayForecast[]; 
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
}

export function WeatherGrid({ forecasts, selectedDate, onSelectDate }: Props) {
  if (!forecasts.length) {
    return <div className={styles.loading}>🌡️ Loading weather…</div>;
  }
  return (
    <div className={styles.grid}>
      {forecasts.slice(0, 7).map((day) => {
        const { dow, date } = formatShortDate(day.date);
        return (
          <div 
            key={day.date} 
            className={`${styles.card} ${selectedDate === day.date ? styles.cardActive : ''}`}
            onClick={() => onSelectDate?.(day.date)}
            style={{ cursor: onSelectDate ? 'pointer' : 'default' }}
          >
            <div className={styles.cardDate}>{dow}<br />{date}</div>
            <div className={styles.cardIcon}>{day.icon}</div>
            <div className={styles.cardLabel}>{day.label}</div>
            <div className={styles.cardTemps}>
              <span className={styles.cardHi}>{day.maxTemp}°</span>
              <span className={styles.cardLo}>{day.minTemp}°</span>
            </div>
            <div className={styles.cardRain}>💧 {day.precipitation} mm ({day.precipProb ?? 0}%)</div>
            {day.hourly && (
              <div className={styles.hourlyWrap}>
                {day.hourly.map(h => (
                  <div key={h.time} className={styles.hourlyRow}>
                    <div className={styles.hourlyTimeCol}>
                      <span className={styles.hourlyTimeText}>{h.time}</span>
                      <span className={styles.hourlyLabel}>{h.label}</span>
                    </div>
                    <span className={styles.hourlyTemp}>
                      <span className={styles.hourlyIcon}>{h.icon}</span>
                      {h.temp}°
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
