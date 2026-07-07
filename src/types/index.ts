// src/types/index.ts
// Central TypeScript type definitions for the entire app.

export type StopRole = 'start' | 'stop' | 'end';

export interface Place {
  id: string;
  name: string;
  note: string;
  lat?: number;
  lon?: number;
  date?: string;
  time?: string;
  weather?: { temp: number; icon: string; precip?: number; label?: string };
  travelTimeHr?: string;
}

export interface TripStop {
  id: string;
  role: StopRole;
  label: string;
  lat: number | null;
  lon: number | null;
  hotel?: GeoResult | null;
  departureTime: string;       // ISO datetime string e.g. '2024-12-25T15:30'
  computedArrivalTime: string | null; // Calculated from previous stop's departure + OSRM duration
  places: Place[];
}

export interface RouteSegment {
  from: number;       // index into stops array
  to: number;
  distance: number;   // metres
  duration: number;   // seconds
  distanceKm: string; // formatted e.g. '540.0'
  durationHr: string; // formatted e.g. '6h 30m'
}

export interface HourlyForecast {
  time: string;
  temp: number;
  icon: string;
  label: string;
  precipProb?: number;
}

export interface DayForecast {
  date: string;
  maxTemp: number;
  minTemp: number;
  weatherCode: number;
  precipitation: number;
  precipProb?: number;
  icon: string;
  label: string;
  hourly?: HourlyForecast[];
}

export interface Trip {
  id: string;
  title: string;
  stops: TripStop[];
  segments: RouteSegment[];
  weather: Record<string, DayForecast[]>; // keyed by stop id
}

export interface GeoResult {
  label: string;
  full: string;
  lat: number;
  lon: number;
  placeId: number;
}

export interface MousePosition {
  x: number;
  y: number;
}

// WMO weather code info
export interface WmoInfo {
  icon: string;
  label: string;
}

export type AlertSeverity = 'info' | 'warning' | 'danger';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  message: string;
  source: string; // e.g. 'Weather', 'Traffic'
  stopId?: string; // If applicable to a specific stop
}
