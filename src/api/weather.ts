// src/api/weather.ts
// Open-Meteo weather API wrapper.
// Free, no API key, uses open meteorological data.

import type { DayForecast, TripStop, WmoInfo } from '../types';

const BASE = 'https://api.open-meteo.com/v1/forecast';

const WMO_CODES: Record<number, WmoInfo> = {
  0:  { icon: '☀️',  label: 'Clear sky' },
  1:  { icon: '🌤️', label: 'Mostly clear' },
  2:  { icon: '⛅',  label: 'Partly cloudy' },
  3:  { icon: '☁️',  label: 'Overcast' },
  45: { icon: '🌫️', label: 'Fog' },
  48: { icon: '🌫️', label: 'Icy fog' },
  51: { icon: '🌦️', label: 'Light drizzle' },
  53: { icon: '🌦️', label: 'Drizzle' },
  55: { icon: '🌧️', label: 'Heavy drizzle' },
  61: { icon: '🌧️', label: 'Slight rain' },
  63: { icon: '🌧️', label: 'Moderate rain' },
  65: { icon: '🌧️', label: 'Heavy rain' },
  71: { icon: '❄️',  label: 'Slight snow' },
  73: { icon: '❄️',  label: 'Moderate snow' },
  75: { icon: '❄️',  label: 'Heavy snow' },
  80: { icon: '🌦️', label: 'Slight showers' },
  81: { icon: '🌧️', label: 'Showers' },
  82: { icon: '⛈️',  label: 'Violent showers' },
  95: { icon: '⛈️',  label: 'Thunderstorm' },
  99: { icon: '⛈️',  label: 'Heavy thunderstorm' },
};

export function wmoInfo(code: number): WmoInfo {
  return WMO_CODES[code] ?? { icon: '🌡️', label: 'Unknown' };
}

export async function getForecast(lat: number, lon: number): Promise<DayForecast[]> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    daily: 'temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum,precipitation_probability_max',
    hourly: 'temperature_2m,weathercode,precipitation,precipitation_probability',
    timezone: 'auto',
    forecast_days: '7',
  });

  try {
    const res = await fetch(`${BASE}?${params}`);
    if (!res.ok) throw new Error(`Weather failed: ${res.status}`);
    const data = await res.json();
    const d = data.daily;
    const h = data.hourly;

    return d.time.map((date: string, i: number): DayForecast => {
      const code = d.weathercode[i] ?? 0;
      const wmo = wmoInfo(code);
      
      const hourlyStart = i * 24;
      const hourly = [8, 14, 16, 20].map(hr => {
        const idx = hourlyStart + hr;
        return {
          time: hr === 8 ? '8 AM' : hr === 14 ? '2 PM' : hr === 16 ? '4 PM' : '8 PM',
          temp: Math.round(h?.temperature_2m?.[idx] ?? 0),
          icon: wmoInfo(h?.weathercode?.[idx] ?? 0).icon,
          label: wmoInfo(h?.weathercode?.[idx] ?? 0).label,
          precipProb: h?.precipitation_probability?.[idx] ?? 0,
        };
      });

      return {
        date,
        maxTemp: Math.round(d.temperature_2m_max[i]),
        minTemp: Math.round(d.temperature_2m_min[i]),
        weatherCode: code,
        precipitation: d.precipitation_sum[i] ?? 0,
        precipProb: d.precipitation_probability_max?.[i] ?? 0,
        icon: wmo.icon,
        label: wmo.label,
        hourly,
      };
    });
  } catch (err) {
    console.error('[Weather] Error:', err);
    return [];
  }
}

export async function fetchAllStopWeather(
  stops: TripStop[],
): Promise<Record<string, DayForecast[]>> {
  const validStops = stops.filter((s) => s.lat !== null && s.lon !== null);
  const results = await Promise.all(
    validStops.map(async (s) => ({
      id: s.id,
      forecast: await getForecast(s.lat!, s.lon!),
    })),
  );
  return Object.fromEntries(results.map((r) => [r.id, r.forecast]));
}

export async function getPlaceWeather(lat: number, lon: number): Promise<{ temp: number; icon: string; precip: number; label: string } | undefined> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: 'temperature_2m,weathercode,precipitation',
    timezone: 'auto',
  });
  try {
    const res = await fetch(`${BASE}?${params}`);
    if (!res.ok) return undefined;
    const data = await res.json();
    if (!data.current) return undefined;
    return {
      temp: Math.round(data.current.temperature_2m),
      icon: wmoInfo(data.current.weathercode).icon,
      label: wmoInfo(data.current.weathercode).label,
      precip: data.current.precipitation ?? 0,
    };
  } catch {
    return undefined;
  }
}
