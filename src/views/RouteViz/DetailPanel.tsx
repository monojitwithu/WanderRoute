// src/views/RouteViz/DetailPanel.tsx
// Right panel: selected stop details, weather strip, places preview.


import { useState, useEffect } from 'react';
import { useTripStore } from '../../store/tripStore';
import { WeatherGrid } from '../../components/WeatherWidget/WeatherGrid';
import { GlassCard } from '../../components/ui/GlassCard/GlassCard';
import { generateAlertsForTrip } from '../../api/alerts';
import { AlertBox } from '../../components/ui/AlertBox/AlertBox';
import { IconButton } from '../../components/ui/IconButton/IconButton';
import weatherStyles from '../../components/WeatherWidget/WeatherWidget.module.css';
import styles from './RouteViz.module.css';

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return 'No time set';
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit'
    });
  } catch { return dateStr; }
}

interface Props { stopId: string; onAddPlaces: (id: string) => void; }

export function DetailPanel({ stopId, onAddPlaces }: Props) {
  const { getStop, getWeather, getSegmentBefore, activeTripId, trips, removePlace } = useTripStore();
  const stop = getStop(stopId);
  const fc   = getWeather(stopId);
  const seg  = getSegmentBefore(stopId);
  
  const activeTrip = activeTripId ? trips[activeTripId] : null;
  const alerts = activeTrip ? generateAlertsForTrip(activeTrip).filter(a => a.stopId === stopId) : [];

  if (!stop) return null;

  const arrival = stop.computedArrivalTime ? new Date(stop.computedArrivalTime) : null;
  const departure = new Date(stop.departureTime);
  const stayForecast = fc.filter(day => {
    const dayDate = new Date(day.date);
    const startOfDay = arrival ? new Date(arrival) : new Date(0);
    if (arrival) startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date(departure);
    endOfDay.setHours(23,59,59,999);
    return dayDate >= startOfDay && dayDate <= endOfDay;
  });

  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    if (stayForecast.length > 0) {
      if (!selectedDate || !stayForecast.some(d => d.date === selectedDate)) {
        setSelectedDate(stayForecast[0].date);
      }
    }
  }, [stayForecast, selectedDate]);

  const filteredPlaces = stop.places.filter(p => !p.date || p.date === selectedDate);

  return (
    <div className={styles.detail}>
      <div className={styles.detailHeader}>
        <h3 className={styles.detailName}>{stop.label || 'Unnamed stop'}</h3>
        <span className={styles.detailDate}>{formatDateTime(stop.computedArrivalTime || stop.departureTime)}</span>
      </div>

      {seg && (
        <GlassCard className={styles.routeInfo}>
          <span>🛣️ {seg.distanceKm} km</span>
          <span>⏱️ {seg.durationHr}</span>
        </GlassCard>
      )}

      {alerts.length > 0 && (
        <div style={{ marginBottom: 'var(--sp-6)' }}>
          {alerts.map(a => <AlertBox key={a.id} alert={a} />)}
        </div>
      )}

      <div className={styles.weatherSection}>
        <h4 className={styles.sectionTitle}>Stay Forecast</h4>
        <WeatherGrid 
          forecasts={stayForecast} 
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </div>

      <div className={styles.placesSection}>
        <div className={styles.placesHeader}>
          <h4 className={styles.sectionTitle}>
            Itinerary {stop.hotel && <span>- {stop.hotel.label.split(',')[0]} (Stay)</span>}
          </h4>
          <button className={styles.manageBtn} onClick={() => onAddPlaces(stopId)}>
            Manage Places
          </button>
        </div>
        {filteredPlaces.length === 0 ? (
          <p className={styles.noPlaces}>No places scheduled for this day.</p>
        ) : (
          <div className={styles.placesList}>
            {filteredPlaces.map((p) => (
              <GlassCard key={p.id} className={styles.placeItem}>
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                      <span className={styles.placeIcon} style={{ marginRight: '12px', marginTop: '2px' }}>📌</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span className={styles.placeName}>{p.name} {p.time && <span style={{ color: 'var(--clr-text-muted)', fontSize: '0.85em' }}>({p.time})</span>}</span>
                          {p.note && <span className={styles.placeNote}>{p.note}</span>}
                        </div>
                        {(p.weather || p.travelTimeHr) && (
                          <div style={{ display: 'flex', gap: 'var(--sp-3)', marginTop: 'var(--sp-2)', flexWrap: 'wrap' }}>
                            {p.weather && (
                              <div className={weatherStyles.card} style={{ minWidth: '130px', padding: 'var(--sp-3)' }}>
                                {p.time && <div className={weatherStyles.cardDate}>{p.time}</div>}
                                <div className={weatherStyles.cardIcon}>{p.weather.icon}</div>
                                <div className={weatherStyles.cardLabel}>{p.weather.label}</div>
                                <div className={weatherStyles.cardTemps}>
                                  <span className={weatherStyles.cardHi}>{p.weather.temp}°</span>
                                </div>
                                {p.weather.precip !== undefined && p.weather.precip > 0 && <div className={weatherStyles.cardRain}>💧 {p.weather.precip} mm</div>}
                              </div>
                            )}
                            {p.travelTimeHr && (
                              <div className={weatherStyles.card} style={{ minWidth: '130px', padding: 'var(--sp-3)', justifyContent: 'center' }}>
                                <span style={{ fontSize: '2rem', margin: 'var(--sp-2) 0' }}>🚗</span>
                                <span className={weatherStyles.cardLabel} style={{ marginTop: 'var(--sp-1)' }}>{p.travelTimeHr}</span>
                                <span className={weatherStyles.cardLo}>one way</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <IconButton
                      icon="x"
                      variant="danger"
                      onClick={() => removePlace(stopId, p.id)}
                      title="Remove Place"
                    />
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
