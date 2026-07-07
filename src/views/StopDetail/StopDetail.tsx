// src/views/StopDetail/StopDetail.tsx
// Full stop detail: 7-day weather grid + places CRUD.

import { useState, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTripStore } from '../../store/tripStore';
import { getForecast } from '../../api/weather';
import { PlacesList } from './PlacesList';
import { FadeInView } from '../../components/ui/FadeInView/FadeInView';
import { Icon } from '../../components/ui/Icon/Icon';
import { GlassCard } from '../../components/ui/GlassCard/GlassCard';
import { LocationInput } from '../../components/LocationInput/LocationInput';
import type { GeoResult } from '../../types';
import { generateAlertsForTrip } from '../../api/alerts';
import { AlertBox } from '../../components/ui/AlertBox/AlertBox';
import styles from './StopDetail.module.css';

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return 'No time set';
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit'
    });
  } catch { return dateStr; }
}

function parseCoordinates(input: string): { lat: number; lon: number } | null {
  const urlMatch = input.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (urlMatch) return { lat: parseFloat(urlMatch[1]), lon: parseFloat(urlMatch[2]) };
  const rawMatch = input.match(/(-?\d+\.\d+)[\s,]+(-?\d+\.\d+)/);
  if (rawMatch) return { lat: parseFloat(rawMatch[1]), lon: parseFloat(rawMatch[2]) };
  return null;
}

export function StopDetail() {
  const navigate    = useNavigate();
  const { activeStopId, getStop, getWeather, updateStopWeather, addPlace, updateStopHotel, fetchAllPlacesData } = useTripStore();
  const activeTrip  = useTripStore((s) => s.activeTripId ? s.trips[s.activeTripId] : null);
  const stop        = activeStopId ? getStop(activeStopId) : null;
  const forecast    = activeStopId ? getWeather(activeStopId) : [];
  
  const alerts      = activeTrip ? generateAlertsForTrip(activeTrip).filter(a => a.stopId === activeStopId) : [];

  const arrival = stop?.computedArrivalTime ? new Date(stop.computedArrivalTime) : null;
  const departure = stop ? new Date(stop.departureTime) : new Date();
  const stayForecast = forecast.filter(day => {
    const dayDate = new Date(day.date);
    const startOfDay = arrival ? new Date(arrival) : new Date(0);
    if (arrival) startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date(departure);
    endOfDay.setHours(23,59,59,999);
    return dayDate >= startOfDay && dayDate <= endOfDay;
  });

  const [placeSearch, setPlaceSearch] = useState('');
  const [placeGeo, setPlaceGeo]       = useState<GeoResult | null>(null);
  const [noteVal, setNoteVal]         = useState('');
  const [shake, setShake]             = useState(false);
  const [isCustom, setIsCustom]       = useState(false);
  const [customName, setCustomName]   = useState('');
  const [customLoc, setCustomLoc]     = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [placeTime, setPlaceTime]     = useState('');

  useEffect(() => {
    if (stayForecast.length > 0) {
      if (!selectedDate || !stayForecast.some(d => d.date === selectedDate)) {
        setSelectedDate(stayForecast[0].date);
      }
    }
  }, [stayForecast, selectedDate]);

  // Guard
  useEffect(() => {
    if (!stop) navigate('/route');
  }, [stop, navigate]);

  // Fetch weather if missing
  useEffect(() => {
    if (stop?.lat && stop?.lon && !forecast.length) {
      getForecast(stop.lat, stop.lon).then((fc) => updateStopWeather(stop.id, fc));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stop?.id]);

  function handleAdd() {
    if (!stop?.hotel) {
      alert('Please set a Base Hotel first to calculate travel times!');
      return;
    }

    if (isCustom) {
      if (!customName.trim() || !customLoc.trim()) {
        setShake(true); setTimeout(() => setShake(false), 500); return;
      }
      const coords = parseCoordinates(customLoc);
      if (!coords) {
        alert('Could not extract coordinates. Please provide valid latitude, longitude or a long Google Maps URL.');
        setShake(true); setTimeout(() => setShake(false), 500); return;
      }
      addPlace(activeStopId!, {
        name: customName.trim(),
        note: noteVal.trim(),
        lat: coords.lat,
        lon: coords.lon,
        date: selectedDate,
        time: placeTime,
      });
      setCustomName('');
      setCustomLoc('');
    } else {
      if (!placeGeo) {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }
      addPlace(activeStopId!, {
        name: placeGeo.label,
        note: noteVal.trim(),
        lat: placeGeo.lat,
        lon: placeGeo.lon,
        date: selectedDate,
        time: placeTime,
      });
      setPlaceGeo(null);
      setPlaceSearch('');
    }
    
    setNoteVal('');
    setIsCustom(false);
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleAdd();
  }

  if (!stop) return null;

  return (
    <div className={`${styles.inner} scrollable`}>
      <FadeInView direction="down" className={styles.header}>
        <button className="btn-ghost" onClick={() => navigate('/route?stop=' + stop.id)}>
          <Icon name="arrow-left" />
          Back to Route
        </button>
        <div>
          <h2 className={styles.name}>{stop.label || 'Unnamed Stop'}</h2>
          <span className={styles.date}>{formatDateTime(stop.computedArrivalTime || stop.departureTime)}</span>
        </div>
      </FadeInView>

      {/* Alerts */}
      {alerts.length > 0 && (
        <FadeInView delay={50}>
          <div style={{ marginBottom: 'var(--sp-6)' }}>
            {alerts.map(a => <AlertBox key={a.id} alert={a} />)}
          </div>
        </FadeInView>
      )}

      {/* Hotel */}
      <FadeInView delay={150}>
        <GlassCard className={styles.section}>
          <h3 className={styles.sectionTitle}>Base Hotel / Stay</h3>
          <div className={styles.addForm}>
            <div style={{ flex: 1 }}>
              <LocationInput
                placeholder="Search hotel or area..."
                value={stop.hotel?.label ?? ''}
                onSelect={(r: GeoResult) => updateStopHotel(stop.id, r)}
                onChange={() => {}} 
              />
            </div>
            {stop.hotel && (
              <button className="btn-ghost" onClick={() => updateStopHotel(stop.id, null)}>
                Clear
              </button>
            )}
          </div>
        </GlassCard>
      </FadeInView>

      {/* Places CRUD */}
      <FadeInView delay={200}>
        <GlassCard className={styles.section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-4)' }}>
            <h3 className={styles.sectionTitle} style={{ marginBottom: 0 }}>Places to Visit</h3>
            <button className="btn-ghost" onClick={() => fetchAllPlacesData(stop.id)}>
              <Icon name="refresh" /> Refresh Data
            </button>
          </div>

          <div className={styles.addForm}>
            {isCustom ? (
              <>
                <input
                  className={`${styles.input} ${shake ? 'shake' : ''}`}
                  type="text"
                  placeholder="Custom place name..."
                  maxLength={80}
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  onKeyDown={handleKey}
                  style={{ flex: 1 }}
                />
                <input
                  className={`${styles.input} ${shake ? 'shake' : ''}`}
                  type="text"
                  placeholder="Paste Google Maps URL or lat,lon..."
                  value={customLoc}
                  onChange={(e) => setCustomLoc(e.target.value)}
                  onKeyDown={handleKey}
                  style={{ flex: 1 }}
                />
              </>
            ) : (
              <div className={`${styles.inputWrapper} ${shake ? 'shake' : ''}`} style={{ flex: 1 }}>
                <LocationInput
                  placeholder="Search place to visit..."
                  value={placeSearch}
                  onSelect={(r: GeoResult) => { setPlaceGeo(r); setPlaceSearch(r.label); }}
                  onChange={(raw: string) => { setPlaceSearch(raw); setPlaceGeo(null); }}
                />
              </div>
            )}
            <input
              className={styles.input}
              type="text"
              placeholder="Note (optional)"
              maxLength={120}
              value={noteVal}
              onChange={(e) => setNoteVal(e.target.value)}
              onKeyDown={handleKey}
            />
            <button className={styles.addBtn} onClick={handleAdd}>+ Add</button>
          </div>
          
          <div className={styles.addForm} style={{ marginTop: 'var(--sp-2)' }}>
            <select 
              className={styles.input} 
              value={selectedDate} 
              onChange={e => setSelectedDate(e.target.value)}
              style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--clr-text-primary)' }}
            >
              <option value="" disabled>Select Date</option>
              {stayForecast.map(day => {
                const dateObj = new Date(day.date + 'T00:00:00');
                const label = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                return <option key={day.date} value={day.date}>{label}</option>;
              })}
            </select>
            <input 
              type="time" 
              className={styles.input}
              value={placeTime}
              onChange={e => setPlaceTime(e.target.value)}
              style={{ flex: 1 }}
            />
          </div>

          <div style={{ marginTop: '8px', fontSize: 'var(--fs-sm)' }}>
             <button onClick={() => setIsCustom(!isCustom)} style={{ background: 'none', border: 'none', color: 'var(--clr-cyan)', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
               {isCustom ? 'Cancel custom place' : "Can't find it? Add custom place..."}
             </button>
          </div>

          <PlacesList stopId={stop.id} selectedDate={selectedDate} />
        </GlassCard>
      </FadeInView>
    </div>
  );
}
