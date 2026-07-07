import { useTripStore } from '../../store/tripStore';
import { FadeInView } from '../../components/ui/FadeInView/FadeInView';
import { IconButton } from '../../components/ui/IconButton/IconButton';
import weatherStyles from '../../components/WeatherWidget/WeatherWidget.module.css';
import styles from './StopDetail.module.css';

interface Props { stopId: string; selectedDate: string; }

export function PlacesList({ stopId, selectedDate }: Props) {
  const { getStop, removePlace } = useTripStore();
  const stop = getStop(stopId);
  if (!stop) return null;

  if (stop.places.length === 0) {
    return (
      <p className={styles.empty}>
        No places added yet. Start building your itinerary above!
      </p>
    );
  }

  const filteredPlaces = stop.places.filter(p => !p.date || p.date === selectedDate);

  if (filteredPlaces.length === 0) {
    return (
      <p className={styles.empty}>
        No places scheduled for this day.
      </p>
    );
  }

  return (
    <div className={styles.list}>
      {filteredPlaces.map((p, i) => (
        <FadeInView key={p.id} delay={i * 50} direction="left">
          <div className={styles.placeItem}>
            <span className={styles.placeNum}>{i + 1}</span>
            <div className={styles.placeContent}>
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <span style={{ marginRight: '12px', marginTop: '2px' }}>📌</span>
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
            </div>
            <IconButton
              icon="x"
              variant="danger"
              onClick={() => removePlace(stopId, p.id)}
              title="Remove"
            />
          </div>
        </FadeInView>
      ))}
    </div>
  );
}
