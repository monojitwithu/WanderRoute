// src/views/RouteViz/RouteViz.tsx
// (Cache refresh)
// Two-panel: route timeline (left) + stop detail panel (right).

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTripStore } from '../../store/tripStore';
import { getForecast, fetchAllStopWeather } from '../../api/weather';
import { getRoute } from '../../api/routing';
import { generateAlertsForTrip } from '../../api/alerts';
import { RouteVisualizer } from '../../components/RouteVisualizer/RouteVisualizer';
import { FadeInView } from '../../components/ui/FadeInView/FadeInView';
import { Icon } from '../../components/ui/Icon/Icon';
import styles from './RouteViz.module.css';
import { DetailPanel } from './DetailPanel';

export function RouteViz() {
  const navigate = useNavigate();
  const activeTrip = useTripStore((s) => (s.activeTripId ? s.trips[s.activeTripId] : null));
  const { setActiveStopId, updateStopWeather, setSegments, setWeather } = useTripStore();
  const stops = useMemo(() => activeTrip?.stops ?? [], [activeTrip?.stops]);
  const segments = useMemo(() => activeTrip?.segments ?? [], [activeTrip?.segments]);
  const weather = useMemo(() => activeTrip?.weather ?? {}, [activeTrip?.weather]);
  const alerts = useMemo(() => activeTrip ? generateAlertsForTrip(activeTrip) : [], [activeTrip]);
  
  const [searchParams] = useSearchParams();
  const stopParam = searchParams.get('stop');
  const [activeId, setActiveId] = useState<string | null>(stopParam ?? stops[0]?.id ?? null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Guard: go back if no stops
  useEffect(() => {
    if (stops.length === 0) navigate('/builder');
  }, [stops, navigate]);

  // Fetch any missing weather in background
  useEffect(() => {
    stops.forEach((stop) => {
      if (stop.lat && stop.lon && !weather[stop.id]) {
        getForecast(stop.lat, stop.lon).then((fc) => updateStopWeather(stop.id, fc));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops]);

  function handleSelect(id: string) {
    setActiveId(id);
  }

  function handleAddPlaces(id: string) {
    setActiveStopId(id);
    navigate('/stop');
  }

  async function handleRefresh() {
    if (!activeTrip) return;
    setIsRefreshing(true);
    try {
      const [segs, wx] = await Promise.all([
        getRoute(stops),
        fetchAllStopWeather(stops)
      ]);
      setSegments(segs);
      setWeather(wx);
    } catch (err) {
      console.error(err);
      alert('Failed to refresh data.');
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <div className={styles.inner}>
      <div className={styles.header}>
        <button className="btn-ghost" onClick={() => navigate('/builder')}>
          <Icon name="arrow-left" />
          Edit Trip
        </button>
        <h2 className={styles.title}>Your Route</h2>
        <button 
          className="btn-ghost" 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          style={{ marginLeft: 'auto' }}
        >
          <Icon name="refresh" />
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      <div className={styles.body}>
        <FadeInView direction="left" className={`${styles.left} scrollable`}>
          <RouteVisualizer
            stops={stops}
            segments={segments}
            weather={weather}
            activeStopId={activeId}
            alerts={alerts}
            onStopSelect={handleSelect}
            onAddPlaces={handleAddPlaces}
          />
        </FadeInView>
        <FadeInView direction="right" className={`${styles.right} scrollable`}>
          {activeId && (
            <DetailPanel
              stopId={activeId}
              onAddPlaces={handleAddPlaces}
            />
          )}
        </FadeInView>
      </div>
    </div>
  );
}
