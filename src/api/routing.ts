// src/api/routing.ts
// OSRM (Open Source Routing Machine) public demo server.
// Free, no API key required.

import type { TripStop, RouteSegment } from '../types';

const BASE = 'https://router.project-osrm.org/route/v1/driving';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export async function getRoute(stops: TripStop[]): Promise<RouteSegment[]> {
  const geocodedStops = stops.filter((s) => s.lat !== null && s.lon !== null);
  if (geocodedStops.length < 2) return [];

  try {
    const promises = [];
    for (let i = 0; i < geocodedStops.length - 1; i++) {
      const from = geocodedStops[i];
      const to = geocodedStops[i + 1];
      const url = `${BASE}/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false&steps=false&annotations=false`;
      promises.push(fetch(url).then(r => {
        if (!r.ok) throw new Error(`OSRM failed: ${r.status}`);
        return r.json();
      }));
    }

    const results = await Promise.all(promises);
    return results.map((data, i): RouteSegment => {
      if (data.code !== 'Ok' || !data.routes?.[0]) {
        throw new Error('OSRM returned no route');
      }
      const leg = data.routes[0].legs[0];
      return {
        from: i,
        to: i + 1,
        distance: leg.distance,
        duration: leg.duration,
        distanceKm: (leg.distance / 1000).toFixed(1),
        durationHr: formatDuration(leg.duration),
      };
    });
  } catch (err) {
    console.error('[Routing] Error:', err);
    // Return placeholders so the UI still renders
    return geocodedStops.slice(0, -1).map((_, i): RouteSegment => ({
      from: i, to: i + 1, distance: 0, duration: 0, distanceKm: '?', durationHr: '?',
    }));
  }
}

export async function getTravelTime(fromLat: number, fromLon: number, toLat: number, toLon: number): Promise<string | undefined> {
  try {
    const url = `${BASE}/${fromLon},${fromLat};${toLon},${toLat}?overview=false&steps=false&annotations=false`;
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.[0]) return undefined;
    
    const leg = data.routes[0].legs[0];
    const durationStr = formatDuration(leg.duration);
    const distanceKm = (leg.distance / 1000).toFixed(1);
    
    return `${distanceKm} km • ${durationStr}`;
  } catch {
    return undefined;
  }
}
