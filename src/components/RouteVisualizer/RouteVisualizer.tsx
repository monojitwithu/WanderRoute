// src/components/RouteVisualizer/RouteVisualizer.tsx
// Vertical route timeline — stop nodes + animated segment lines.

import type { TripStop, RouteSegment, DayForecast, Alert } from '../../types';
import { Icon } from '../ui/Icon/Icon';
import { AlertBox } from '../ui/AlertBox/AlertBox';
import styles from './RouteVisualizer.module.css';

const ROLE_ICON  = { start: '🚀', stop: '📍', end: '🏁' } as const;
const ROLE_COLOR = { start: '#ffd54f', stop: '#00bfff', end: '#ff6b6b' } as const;

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit'
    });
  } catch { return dateStr; }
}

interface Props {
  stops: TripStop[];
  segments: RouteSegment[];
  weather: Record<string, DayForecast[]>;
  activeStopId: string | null;
  alerts: Alert[];
  onStopSelect: (id: string) => void;
  onAddPlaces: (id: string) => void;
}

export function RouteVisualizer({ stops, segments, weather, activeStopId, alerts, onStopSelect, onAddPlaces }: Props) {
  return (
    <div className={styles.timeline}>
      {stops.map((stop, i) => {
        const color   = ROLE_COLOR[stop.role];
        const icon    = ROLE_ICON[stop.role];
        const seg     = segments[i - 1];
        const fc      = weather[stop.id]?.[0];
        const isActive = stop.id === activeStopId;
        const stopAlerts = alerts.filter(a => a.stopId === stop.id || (!a.stopId && stop.role === 'start'));

        return (
          <div key={stop.id}>
            {/* Segment line between stops */}
            {i > 0 && seg && (
              <div className={styles.segment}>
                <div className={styles.segLine}>
                  <div className={styles.segFlow} />
                </div>
                <div className={styles.segInfo}>
                  <div className={styles.segDist}>
                    ~ {seg.distanceKm} km
                    <span 
                      className={styles.infoIcon} 
                      title="Distances are calculated via open-source routing (OSRM) and may vary approx 10-15% from proprietary engines like Google Maps."
                    >
                      <Icon name="info" size={14} />
                    </span>
                  </div>
                  <div className={styles.segDur}>{seg.durationHr}</div>
                </div>
              </div>
            )}

            {/* Stop node */}
            <div
              className={`${styles.node} ${isActive ? styles.nodeActive : ''}`}
              onClick={() => onStopSelect(stop.id)}
              style={{ '--node-color': color } as React.CSSProperties}
            >
              <div
                className={styles.dot}
                style={{ borderColor: color, boxShadow: isActive ? `0 0 20px ${color}66` : undefined }}
              >
                <span className={styles.dotIcon}>{icon}</span>
              </div>

              <div className={styles.info}>
                <span className={styles.label}>{stop.label || 'Unnamed stop'}</span>
                {stop.computedArrivalTime && (
                  <span className={styles.date} style={{ color: 'var(--clr-text-secondary)' }}>
                    Arrive: {formatDateTime(stop.computedArrivalTime)}
                  </span>
                )}
                {stop.role !== 'end' && (
                  <span className={styles.date}>Depart: {formatDateTime(stop.departureTime)}</span>
                )}
                {stop.role === 'end' && !stop.computedArrivalTime && (
                  <span className={styles.date}>{formatDateTime(stop.departureTime)}</span>
                )}
                {fc ? (
                  <div className={styles.weather}>
                    <span>{fc.icon}</span>
                    <span className={styles.wtemp}>{fc.maxTemp}°C</span>
                    <span className={styles.wlabel}>{fc.label}</span>
                  </div>
                ) : (
                  <span className={styles.weatherLoading}>🌡️ Loading…</span>
                )}
                
                {stopAlerts.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    {stopAlerts.map(a => <AlertBox key={a.id} alert={a} />)}
                  </div>
                )}
              </div>


              <button
                className={styles.addBtn}
                title="Add places to visit"
                onClick={(e) => { e.stopPropagation(); onAddPlaces(stop.id); }}
              >+</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
