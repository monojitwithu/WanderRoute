// src/views/TripBuilder/StopRow.tsx
// Single editable stop row inside the trip builder form using Formik.

import { LocationInput } from '../../components/LocationInput/LocationInput';
import { GlassCard } from '../../components/ui/GlassCard/GlassCard';
import { RoleBadge } from '../../components/ui/RoleBadge/RoleBadge';
import { IconButton } from '../../components/ui/IconButton/IconButton';
import type { TripStop, GeoResult } from '../../types';
import styles from './TripBuilder.module.css';
import { useFormikContext, getIn } from 'formik';
import { useTripStore } from '../../store/tripStore';

interface Props {
  stop: TripStop;
  index: number;
  onRemove?: () => void;
}

export function StopRow({ stop, index, onRemove }: Props) {
  const { setFieldValue, errors, touched } = useFormikContext<any>();
  const namePrefix = `stops.${index}`;

  const activeTripId = useTripStore((s) => s.activeTripId);
  const zustandStop = useTripStore((s) => activeTripId ? s.trips[activeTripId]?.stops.find(x => x.id === stop.id) : null);
  const computedArrivalTime = zustandStop?.computedArrivalTime;

  function handleSelect(r: GeoResult) {
    setFieldValue(`${namePrefix}.label`, r.label);
    setFieldValue(`${namePrefix}.lat`, r.lat);
    setFieldValue(`${namePrefix}.lon`, r.lon);
  }

  const departureStr = stop.departureTime || (stop as any).date || '';
  let datePart = '';
  let timePart = '';
  if (departureStr) {
    if (departureStr.includes('T')) {
      const [d, t] = departureStr.split('T');
      datePart = d;
      timePart = t.slice(0, 5);
    } else {
      datePart = departureStr;
      timePart = '';
    }
  }

  function handleDate(d: string) {
    const t = timePart || '10:00';
    setFieldValue(`${namePrefix}.departureTime`, d ? `${d}T${t}` : '');
  }

  function handleTimeChange(t: string) {
    const d = datePart || new Date().toISOString().split('T')[0];
    const finalTime = t || '00:00';
    setFieldValue(`${namePrefix}.departureTime`, `${d}T${finalTime}`);
  }

  const isFixed = stop.role !== 'stop';

  const labelError = getIn(touched, `${namePrefix}.label`) && getIn(errors, `${namePrefix}.label`);
  const latError = getIn(touched, `${namePrefix}.lat`) && getIn(errors, `${namePrefix}.lat`);
  const timeError = getIn(touched, `${namePrefix}.departureTime`) && getIn(errors, `${namePrefix}.departureTime`);

  return (
    <div className={`${styles.row} ${styles[`row_${stop.role}`]}`}>
      {/* Left connector */}
      <div className={styles.connector}>
        <div className={styles.connDot} />
        <div className={styles.connLine} />
      </div>

      {/* Card */}
      <GlassCard className={styles.card} focusHighlight>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'var(--sp-3)' }}>
          <RoleBadge role={stop.role} />
          {!timeError && computedArrivalTime && (
            <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-secondary)', fontWeight: 500 }}>
              Arrive: {new Date(computedArrivalTime).toLocaleString('en-IN', {
                month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
              })}
            </span>
          )}
        </div>
        <div className={styles.fields}>
          <div className={styles.dateWrap}>
            <label className={styles.inputLabel}>Location</label>
            <LocationInput
              placeholder="City, country…"
              value={stop.label}
              onSelect={handleSelect}
            />
            {(labelError || latError) && <span className={styles.errorText}>{labelError || latError}</span>}
          </div>
          
          <div className={styles.dateWrap}>
            <label className={styles.inputLabel}>Departure</label>
            <div className={styles.dateTimeGroup}>
              <input
                type="date"
                className={styles.dateInput}
                value={datePart}
                onChange={(e) => handleDate(e.target.value)}
                required
              />
              <div className={styles.timeInputWrap}>
                <input
                  type="time"
                  className={styles.dateInput}
                  value={timePart}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  required
                />
                {timePart && timePart !== '00:00' && (
                  <button type="button" className={styles.clearTimeBtn} onClick={() => handleTimeChange('')}>
                    ×
                  </button>
                )}
              </div>
            </div>
            {timeError && <span className={styles.errorText}>{timeError}</span>}
          </div>
        </div>
        {!isFixed && onRemove && (
          <IconButton
            icon="x"
            variant="danger"
            className={styles.removeBtn}
            onClick={onRemove}
            title="Remove stop"
          />
        )}
      </GlassCard>
    </div>
  );
}
