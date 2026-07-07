// src/api/geocoding.ts
// Nominatim (OpenStreetMap) geocoding wrapper.
// Free, no API key. Rate limit: 1 req/sec — enforced by debounce in LocationInput.

import type { GeoResult } from '../types';

const BASE = 'https://nominatim.openstreetmap.org';
const HEADERS: HeadersInit = {
  'Accept-Language': 'en',
  'User-Agent': 'WanderRoute/2.0',
};

export async function searchPlaces(query: string): Promise<GeoResult[]> {
  if (!query || query.trim().length < 2) return [];

  const url =
    `${BASE}/search?format=json&limit=5&addressdetails=1&q=${encodeURIComponent(query.trim())}`;

  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`);
    const results = await res.json();

    return results.map((r: any): GeoResult => {
      const addr = r.address || {};
      const city =
        addr.city || addr.town || addr.village || addr.county || '';
      
      const featureName = r.name || r.display_name.split(',')[0];
      const labelParts = [featureName];
      
      if (city && city !== featureName) labelParts.push(city);
      if (addr.state && addr.state !== featureName && addr.state !== city) labelParts.push(addr.state);
      if (addr.country) labelParts.push(addr.country);

      const label = labelParts.filter(Boolean).join(', ');

      return {
        label,
        full: r.display_name,
        lat: parseFloat(r.lat),
        lon: parseFloat(r.lon),
        placeId: r.place_id,
      };
    });
  } catch (err) {
    console.error('[Geocoding] Search error:', err);
    return [];
  }
}

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(`${BASE}/reverse?format=json&lat=${lat}&lon=${lon}`, {
      headers: HEADERS,
    });
    const r = await res.json();
    const addr = r.address || {};
    const city = addr.city || addr.town || addr.village || r.display_name.split(',')[0];
    return [city, addr.country].filter(Boolean).join(', ');
  } catch {
    return 'Unknown location';
  }
}
