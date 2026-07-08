// src/store/tripStore.ts
// Zustand store — single source of truth for all trip data.
// No Provider needed. Import useTripStore() anywhere.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getPlaceWeather, fetchAllStopWeather } from '../api/weather';
import { getTravelTime, getRoute } from '../api/routing';
import type { Trip, TripStop, RouteSegment, DayForecast, StopRole, Place, GeoResult } from '../types';

function newId(): string {
  return `stop_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
}

function placeId(): string {
  return `place_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
}

function tripId(): string {
  return `trip_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
}

export function createStop(role: StopRole): TripStop {
  return {
    id: newId(),
    role,
    label: '',
    lat: null,
    lon: null,
    departureTime: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
    computedArrivalTime: null,
    places: [],
  };
}

// ── Store shape ─────────────────────────────────────────────────────────────

interface TripStore {
  // Global Trips State
  trips: Record<string, Trip>;
  activeTripId: string | null;

  // Trip Management
  createTrip: (title: string) => string;
  deleteTrip: (id: string) => void;
  loadTrip: (id: string) => void;
  updateTripTitle: (id: string, title: string) => void;

  // UI state
  activeStopId: string | null;

  // Stop actions (acts on activeTrip)
  addStop: (role?: StopRole) => TripStop | undefined;
  removeStop: (id: string) => void;
  updateStop: (id: string, fields: Partial<TripStop>) => void;
  updateStopHotel: (id: string, hotel: GeoResult | null) => void;
  setTripStops: (stops: TripStop[]) => void;

  // Route data actions (acts on activeTrip)
  setSegments: (segments: RouteSegment[]) => void;
  setWeather: (weather: Record<string, DayForecast[]>) => void;
  updateStopWeather: (stopId: string, forecast: DayForecast[]) => void;

  // Places (acts on activeTrip)
  addPlace: (stopId: string, place: Omit<Place, 'id'>) => void;
  removePlace: (stopId: string, placeId: string) => void;
  updatePlace: (stopId: string, placeId: string, fields: Partial<Place>) => void;
  fetchPlaceData: (stopId: string, placeId: string) => Promise<void>;
  fetchAllPlacesData: (stopId: string) => Promise<void>;

  // UI
  setActiveStopId: (id: string | null) => void;

  // Selectors
  getActiveTrip: () => Trip | undefined;
  getStop: (id: string) => TripStop | undefined;
  getWeather: (stopId: string) => DayForecast[];
  getSegmentBefore: (stopId: string) => RouteSegment | undefined;

  // Refreshes all routing and weather data
  refreshAllData: () => Promise<void>;
}

// ── Helper to mutate active trip ──────────────────────────────────────────────
// A small utility inside the store to avoid repetitive activeTripId checks.
const mutateActiveTrip = (
  state: TripStore,
  updater: (trip: Trip) => Partial<Trip>
): Partial<TripStore> => {
  const { activeTripId, trips } = state;
  if (!activeTripId || !trips[activeTripId]) return {};
  const currentTrip = trips[activeTripId];
  return {
    trips: {
      ...trips,
      [activeTripId]: { ...currentTrip, ...updater(currentTrip) },
    },
  };
};

function recalculateArrivals(trip: Trip): Trip {
  if (trip.stops.length === 0) return trip;
  if (trip.segments.length !== trip.stops.length - 1) {
    return {
      ...trip,
      stops: trip.stops.map(s => ({ ...s, computedArrivalTime: null }))
    };
  }

  try {
    const startDepStr = trip.stops[0].departureTime || (trip.stops[0] as any).date;
    const isValidStart = startDepStr && startDepStr.includes('T');
    let currentDeparture = isValidStart ? new Date(startDepStr).getTime() : NaN;
    
    const nextStops = trip.stops.map((stop, i) => {
      if (i === 0) return { ...stop, computedArrivalTime: null };
      
      if (!isValidStart || isNaN(currentDeparture)) {
        return { ...stop, computedArrivalTime: null };
      }
      
      const segment = trip.segments[i - 1];
      const arrivalTime = currentDeparture + (segment.duration * 1000);
      
      const nextDepStr = stop.departureTime || (stop as any).date;
      let nextDepTime = (nextDepStr && nextDepStr.includes('T')) ? new Date(nextDepStr).getTime() : arrivalTime;
      
      // Auto-push departure time if it is before arrival time
      if (nextDepTime < arrivalTime) {
        nextDepTime = arrivalTime;
      }
      currentDeparture = nextDepTime;
      
      if (isNaN(arrivalTime)) return { ...stop, computedArrivalTime: null };
      
      return { 
        ...stop, 
        computedArrivalTime: new Date(arrivalTime - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
        departureTime: new Date(nextDepTime - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
      };
    });

    return { ...trip, stops: nextStops };
  } catch (e) {
    console.error('Failed to recalculate arrivals', e);
    return trip;
  }
}

// ── Store implementation ─────────────────────────────────────────────────────

export const useTripStore = create<TripStore>()(
  persist(
    (set, get) => ({
      trips: {},
      activeTripId: null,
      activeStopId: null,

      // ── Trip Management ───────────────────────────────────────────────────

      createTrip: (title) => {
        const id = tripId();
        const newTrip: Trip = {
          id,
          title,
          stops: [createStop('start'), createStop('end')],
          segments: [],
          weather: {},
        };
        set((state) => ({
          trips: { ...state.trips, [id]: newTrip },
          activeTripId: id,
          activeStopId: null,
        }));
        return id;
      },

      deleteTrip: (id) =>
        set((state) => {
          const nextTrips = { ...state.trips };
          delete nextTrips[id];
          return {
            trips: nextTrips,
            activeTripId: state.activeTripId === id ? null : state.activeTripId,
          };
        }),

      loadTrip: (id) =>
        set({ activeTripId: id, activeStopId: null }),

      updateTripTitle: (id, title) =>
        set((state) => {
          const trip = state.trips[id];
          if (!trip) return {};
          return { trips: { ...state.trips, [id]: { ...trip, title } } };
        }),

      // ── Stop actions ──────────────────────────────────────────────────────────

      addStop: (role = 'stop') => {
        const stop = createStop(role);
        set((state) =>
          mutateActiveTrip(state, (trip) => {
            if (role === 'start') return { stops: [stop, ...trip.stops] };
            if (role === 'end') return { stops: [...trip.stops, stop] };
            
            const endIdx = trip.stops.findLastIndex((s) => s.role === 'end');
            if (endIdx === -1) return { stops: [...trip.stops, stop] };
            
            const next = [...trip.stops];
            next.splice(endIdx, 0, stop);
            return { stops: next };
          })
        );
        return stop;
      },

      removeStop: (id) =>
        set((state) =>
          mutateActiveTrip(state, (trip) => ({
            stops: trip.stops.filter((s) => s.id !== id),
          }))
        ),

      updateStop: (id, fields) =>
        set((state) =>
          mutateActiveTrip(state, (trip) => {
            const nextTrip = {
              ...trip,
              stops: trip.stops.map((s) => (s.id === id ? { ...s, ...fields } : s)),
            };
            return recalculateArrivals(nextTrip);
          })
        ),

      updateStopHotel: (id, hotel) => {
        set((state) =>
          mutateActiveTrip(state, (trip) => {
            const nextTrip = {
              ...trip,
              stops: trip.stops.map((s) => (s.id === id ? { ...s, hotel } : s)),
            };
            return nextTrip;
          })
        );
        get().fetchAllPlacesData(id);
      },
        
      setTripStops: (stops) =>
        set((state) =>
          mutateActiveTrip(state, (trip) => recalculateArrivals({ ...trip, stops }))
        ),

      // ── Route data ────────────────────────────────────────────────────────────

      setSegments: (segments) =>
        set((state) => mutateActiveTrip(state, (trip) => recalculateArrivals({ ...trip, segments }))),

      setWeather: (weather) =>
        set((state) => mutateActiveTrip(state, () => ({ weather }))),

      updateStopWeather: (stopId, forecast) =>
        set((state) =>
          mutateActiveTrip(state, (trip) => ({
            weather: { ...trip.weather, [stopId]: forecast },
          }))
        ),

      // ── Places ────────────────────────────────────────────────────────────────

      addPlace: (stopId, placeData) => {
        const pid = placeId();
        set((state) =>
          mutateActiveTrip(state, (trip) => ({
            stops: trip.stops.map((s) =>
              s.id === stopId
                ? { ...s, places: [...s.places, { ...placeData, id: pid }] }
                : s
            ),
          }))
        );
        get().fetchPlaceData(stopId, pid);
      },

      removePlace: (stopId, pid) =>
        set((state) =>
          mutateActiveTrip(state, (trip) => ({
            stops: trip.stops.map((s) =>
              s.id === stopId ? { ...s, places: s.places.filter((p) => p.id !== pid) } : s
            ),
          }))
        ),

      updatePlace: (stopId, pid, fields) =>
        set((state) =>
          mutateActiveTrip(state, (trip) => ({
            stops: trip.stops.map((s) =>
              s.id === stopId
                ? { ...s, places: s.places.map((p) => (p.id === pid ? { ...p, ...fields } : p)) }
                : s
            ),
          }))
        ),

      fetchPlaceData: async (stopId, pid) => {
        const stop = get().getStop(stopId);
        if (!stop) return;
        const place = stop.places.find(p => p.id === pid);
        if (!place || !place.lat || !place.lon) return;

        const wx = await getPlaceWeather(place.lat, place.lon);
        
        let timeStr = undefined;
        const baseLat = stop.hotel?.lat ?? stop.lat;
        const baseLon = stop.hotel?.lon ?? stop.lon;
        if (baseLat && baseLon) {
          timeStr = await getTravelTime(baseLat, baseLon, place.lat, place.lon);
        }

        get().updatePlace(stopId, pid, {
          weather: wx,
          travelTimeHr: timeStr
        });
      },

      fetchAllPlacesData: async (stopId) => {
        const stop = get().getStop(stopId);
        if (!stop) return;
        for (const place of stop.places) {
          await get().fetchPlaceData(stopId, place.id);
        }
      },

      // ── UI ────────────────────────────────────────────────────────────────────

      setActiveStopId: (id) => set({ activeStopId: id }),

      // ── Selectors ─────────────────────────────────────────────────────────────

      getActiveTrip: () => {
        const { activeTripId, trips } = get();
        return activeTripId ? trips[activeTripId] : undefined;
      },

      getStop: (id) => get().getActiveTrip()?.stops.find((s) => s.id === id),

      getWeather: (stopId) => get().getActiveTrip()?.weather[stopId] ?? [],

      getSegmentBefore: (stopId) => {
        const trip = get().getActiveTrip();
        if (!trip) return undefined;
        const idx = trip.stops.findIndex((s) => s.id === stopId);
        if (idx <= 0) return undefined;
        return trip.segments[idx - 1];
      },

      refreshAllData: async () => {
        const trip = get().getActiveTrip();
        if (!trip) return;

        try {
          const [segs, wx, updatedStops] = await Promise.all([
            getRoute(trip.stops),
            fetchAllStopWeather(trip.stops),
            Promise.all(trip.stops.map(async (stop) => {
              if (!stop.lat || !stop.lon || stop.places.length === 0) return stop;
              const newPlaces = await Promise.all(stop.places.map(async (p) => {
                if (!p.lat || !p.lon) return p;
                const weatherPromise = getPlaceWeather(p.lat, p.lon);
                
                const baseLat = stop.hotel?.lat ?? stop.lat;
                const baseLon = stop.hotel?.lon ?? stop.lon;
                let travelTimeHr = p.travelTimeHr;
                if (baseLat && baseLon) {
                  const routeSegs = await getRoute([{ lat: baseLat, lon: baseLon } as any, { lat: p.lat, lon: p.lon } as any]);
                  travelTimeHr = routeSegs.length > 0 ? routeSegs[0].durationHr : p.travelTimeHr;
                }

                const weather = await weatherPromise;
                return {
                  ...p,
                  weather: weather || p.weather,
                  travelTimeHr
                };
              }));
              return { ...stop, places: newPlaces };
            }))
          ]);

          get().setTripStops(updatedStops);
          get().setSegments(segs);
          get().setWeather(wx);
        } catch (e) {
          console.error("Failed to refresh all trip data", e);
          throw e;
        }
      },
    }),
    {
      name: 'trip-storage',
    }
  )
);
