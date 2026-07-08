# WanderRoute — Trip Planner · Agent Reference Document (v2 — React + TypeScript)

> **For any AI agent or developer picking up this project:**
> Read this file fully before touching any code.
> Every architectural decision, data flow, component API, and task status lives here.
> **This project has been fully rewritten from vanilla JS → React 18 + TypeScript + Vite.**

---

## 1. Project Overview

**WanderRoute** is a React + TypeScript trip planner deployed on GitHub Pages via GitHub Actions.

**Core experience:**
1. Animated ambient home screen → "Start Planning"
2. Trip Builder: add Start + Stops + End with city autocomplete + date pickers
3. Visualise Route: parallel OSRM + Open-Meteo fetch → interactive route timeline
4. Stop Detail: 7-day weather grid + full places-to-visit CRUD

**Tech stack:**
| Layer | Choice |
|---|---|
| Build | Vite 8 + `@vitejs/plugin-react` |
| UI | React 18 + TypeScript |
| State | Zustand (no Provider, imported directly) |
| Routing | React Router v6 (`HashRouter` — works on Netlify without SPA redirect) |
| CSS | Vanilla CSS + CSS Modules per component |
| Animation | Custom React hook (`useParticleEngine`) + rAF canvas |

---

## 2. File Structure

```
Trip App/
│
├── AGENTS.md                              ← YOU ARE HERE
├── index.html                             ← Vite HTML entry (single <div id="root">)
├── vite.config.ts                         ← Vite config: react plugin, port 5173, dist output
├── tsconfig.json                          ← Strict TS config
├── package.json                           ← deps: react, react-dom, react-router-dom, zustand
├── .github/workflows/deploy.yml         ← GitHub Actions deployment pipeline
│
├── src/
│   ├── main.tsx                           ← Entry: imports global.css, renders <App>
│   ├── App.tsx                            ← Root: HashRouter → ParticleCanvas → Routes
│   │
│   ├── types/
│   │   └── index.ts                       ← All shared TS interfaces (canonical)
│   │
│   ├── store/
│   │   └── tripStore.ts                   ← Zustand store: all trip state + actions
│   │
│   ├── api/
│   │   ├── geocoding.ts                   ← Nominatim: searchPlaces(), reverseGeocode()
│   │   ├── routing.ts                     ← OSRM: getRoute(stops[]) → RouteSegment[]
│   │   └── weather.ts                     ← Open-Meteo: getForecast(), fetchAllStopWeather()
│   │
│   ├── hooks/
│   │   ├── useMousePosition.ts            ← Shared ref-based mouse tracker (no re-renders)
│   │   └── useParticleEngine.ts           ← rAF loop: particles + bg gradient + btn physics
│   │
│   ├── components/
│   │   ├── ParticleCanvas/
│   │   │   └── ParticleCanvas.tsx         ← Fixed canvas + EngineContext (registerEl / unregisterEl)
│   │   ├── LocationInput/
│   │   │   ├── LocationInput.tsx          ← Debounced autocomplete component
│   │   │   └── LocationInput.module.css
│   │   ├── WeatherWidget/
│   │   │   ├── WeatherStrip.tsx           ← 5-day horizontal strip
│   │   │   ├── WeatherGrid.tsx            ← 7-day grid (stop detail)
│   │   │   └── WeatherWidget.module.css
│   │   └── RouteVisualizer/
│   │       ├── RouteVisualizer.tsx        ← Pure component: stop nodes + segment flow lines
│   │       └── RouteVisualizer.module.css
│   │
│   ├── views/
│   │   ├── Home/
│   │   │   ├── Home.tsx                   ← useEngine() for physics, navigate('/builder')
│   │   │   └── Home.module.css
│   │   ├── TripBuilder/
│   │   │   ├── TripBuilder.tsx            ← Stop list manager, parallel fetch, navigate('/route')
│   │   │   ├── StopRow.tsx                ← Single stop card (LocationInput + date input)
│   │   │   └── TripBuilder.module.css
│   │   ├── RouteViz/
│   │   │   ├── RouteViz.tsx               ← Two-panel layout, async weather backfill
│   │   │   ├── DetailPanel.tsx            ← Right panel: weather strip + places list
│   │   │   └── RouteViz.module.css
│   │   └── StopDetail/
│   │       ├── StopDetail.tsx             ← 7-day weather + places CRUD form
│   │       ├── PlacesList.tsx             ← Animated numbered places list
│   │       └── StopDetail.module.css
│   │
│   └── styles/
│       └── global.css                     ← Design tokens (:root), global reset, shared classes
│
└── dist/                                  ← Vite build output (Netlify publishes this)
```

---

## 3. Routes

```
HashRouter routes (using /#/ prefix — no server config needed):

/#/         →  Home view
/#/builder  →  TripBuilder view
/#/route    →  RouteViz view
/#/stop     →  StopDetail view (requires activeStopId in store)
```

**Navigation pattern:** Always use `useNavigate()` from react-router-dom. Never use `window.location`.

---

## 4. Global Namespace / Context

| What | Where | How to use |
|---|---|---|
| Particle engine | `ParticleCanvas.tsx` via `EngineContext` | `const { registerEl, unregisterEl } = useEngine()` |
| Trip state | `store/tripStore.ts` | `const { stops, addStop } = useTripStore()` |
| Design tokens | `styles/global.css` | `var(--clr-accent)`, `var(--sp-4)`, etc. |

**EngineContext** is provided by `<ParticleCanvas>` in `App.tsx`. Any component inside the router can call `useEngine()` to register DOM elements for particle physics repulsion.

---

## 5. TypeScript Interfaces (src/types/index.ts)

```ts
StopRole = 'start' | 'stop' | 'end'

TripStop {
  id: string            // generated ID
  role: StopRole
  label: string         // display name from Nominatim
  lat: number | null
  lon: number | null
  date: string          // 'YYYY-MM-DD'
  places: Place[]
}

Place { id, name, note }

RouteSegment {
  from, to,             // indices into stops[]
  distance,             // metres
  duration,             // seconds
  distanceKm,           // '540.0'
  durationHr,           // '6h 30m'
}

DayForecast {
  date, maxTemp, minTemp, weatherCode,
  precipitation, icon, label
}

GeoResult { label, full, lat, lon, placeId }
```

---

## 6. Zustand Store (src/store/tripStore.ts)

**Import anywhere:** `import { useTripStore } from '../store/tripStore'`

### State shape:
```ts
stops: TripStop[]
segments: RouteSegment[]
weather: Record<string, DayForecast[]>   // keyed by stop id
activeStopId: string | null
```

### Actions:
| Action | Signature | Effect |
|---|---|---|
| `addStop` | `(role?) → TripStop` | Creates + inserts stop (middle before end) |
| `removeStop` | `(id) → void` | Removes from stops array |
| `updateStop` | `(id, fields) → void` | Partial update |
| `resetTrip` | `() → void` | Clears everything |
| `setSegments` | `(segs) → void` | Set OSRM results |
| `setWeather` | `(wx) → void` | Set full weather map |
| `updateStopWeather` | `(stopId, forecast) → void` | Patch single stop's weather |
| `addPlace` | `(stopId, name, note?) → void` | Append place to stop |
| `removePlace` | `(stopId, placeId) → void` | Remove place |
| `setActiveStopId` | `(id) → void` | Required before navigating to /stop |

### Selectors:
| Selector | Returns |
|---|---|
| `getStop(id)` | `TripStop \| undefined` |
| `getWeather(stopId)` | `DayForecast[]` |
| `getSegmentBefore(stopId)` | `RouteSegment \| undefined` |

---

## 7. Real-Time Data Architecture

### 7a. City Autocomplete (Nominatim)

**File:** `src/api/geocoding.ts`
**API:** `https://nominatim.openstreetmap.org/search`
**Rate limit:** 1 req/s enforced by 380ms debounce in LocationInput

```
User types → 380ms debounce → searchPlaces(query)
  → GET /search?format=json&limit=5&q=...
  → GeoResult[] { label, lat, lon, placeId }
  → LocationInput dropdown renders
  → onSelect(r) → store.updateStop(id, { label, lat, lon })
```

### 7b. Driving Routes (OSRM)

**File:** `src/api/routing.ts`
**API:** `https://router.project-osrm.org/route/v1/driving/{lon,lat};...`
**No API key.**

```
TripBuilder "Visualise" click
  → getRoute(stops[])
  → GET /route/v1/driving/77.59,12.97;...?overview=false
  → RouteSegment[] per leg { distanceKm, durationHr }
  → store.setSegments(segs)
```

**Fallback:** If OSRM fails, returns `{ distanceKm: '?', durationHr: '?' }` per segment. UI still renders.

### 7c. Weather Forecasts (Open-Meteo)

**File:** `src/api/weather.ts`
**API:** `https://api.open-meteo.com/v1/forecast`
**No API key. Open data (ERA5/ECMWF).**

```
fetchAllStopWeather(stops[])
  → N parallel getForecast(lat, lon) calls
  → GET /forecast?daily=temp_max,temp_min,weathercode,precipitation&timezone=auto&forecast_days=7
  → DayForecast[] per stop (7 days)
  → store.setWeather(weatherMap)

Background backfill in RouteViz and StopDetail:
  → If weather[stopId] is empty → getForecast → store.updateStopWeather(id, fc)
```

**WMO code → emoji/label** mapping: `wmoInfo(code)` in weather.ts.

### 7d. Parallel Fetch

In `TripBuilder.tsx`:
```ts
const [segs, wx] = await Promise.all([
  getRoute(stops),
  fetchAllStopWeather(stops),
]);
store.setSegments(segs);
store.setWeather(wx);
navigate('/route');
```

---

## 8. Animation System

**Hook:** `src/hooks/useParticleEngine.ts`
**Context:** `src/components/ParticleCanvas/ParticleCanvas.tsx` (EngineContext)

### How it works:
1. `App.tsx` renders `<ParticleCanvas>` which calls `useParticleEngine(canvasRef, mouseRef)`
2. `useParticleEngine` starts a single `requestAnimationFrame` loop
3. The loop draws:
   - Radial gradient background (pulsing on sin wave)
   - 300 `Mote` particle objects floating upward with sway + glow
   - Physics repulsion on registered interactive DOM elements
4. Canvas is `position: fixed`, `z-index: 1`, pointer-events: none
5. Cursor orb `#cursor-orb` follows mouse with cyan glow

### Interactive element physics:
```ts
// In any component inside <ParticleCanvas>:
const { registerEl, unregisterEl } = useEngine();
const ref = useRef<HTMLElement>(null);
useEffect(() => {
  if (ref.current) {
    registerEl(ref.current);
    return () => unregisterEl(ref.current!);
  }
}, []);
```

### Canvas never unmounts — it persists across all route changes.

---

## 9. Design System

All tokens in `src/styles/global.css` `:root`. **Always use tokens.**

| Token | Value | Use |
|---|---|---|
| `--clr-accent` | `#ffd54f` | Primary interactive (CTA, highlights) |
| `--clr-bg` | `#0d0f12` | Page background |
| `--clr-surface` | `rgba(255,255,255,0.04)` | Card/panel backgrounds |
| `--clr-border` | `rgba(255,255,255,0.1)` | Borders |
| `--clr-cyan` | `#00bfff` | Focus rings, flow lines, autocomplete |
| `--clr-danger` | `#ff6b6b` | End stop, remove buttons |
| `--font-base` | `'Outfit', system-ui` | All text |
| `--ease-spring` | `cubic-bezier(0.34,1.56,0.64,1)` | Bounce hover effects |

**Shared CSS classes** (defined in global.css, usable anywhere):
- `.btn-ghost` — outlined back buttons
- `.btn-primary` — filled accent CTA buttons
- `.input-field` — styled form input
- `.scrollable` — thin scrollbar override
- `.shake` — horizontal shake keyframe for validation

---

## 10. Component APIs

### LocationInput
```tsx
<LocationInput
  placeholder="Search city…"
  value={stop.label}
  onSelect={(r: GeoResult) => { /* r.label, r.lat, r.lon */ }}
  onChange={(raw: string) => { /* raw text if not yet geocoded */ }}
/>
```
- Debounce: 380ms, max 5 suggestions
- Keyboard: ↑↓ navigate, Enter select, Escape close

### WeatherStrip
```tsx
<WeatherStrip forecasts={DayForecast[]} days={5} />
```

### WeatherGrid
```tsx
<WeatherGrid forecasts={DayForecast[]} />   {/* always 7 days */}
```

### RouteVisualizer
```tsx
<RouteVisualizer
  stops={TripStop[]}
  segments={RouteSegment[]}
  weather={Record<string, DayForecast[]>}
  activeStopId={string | null}
  onStopSelect={(id: string) => void}
  onAddPlaces={(id: string) => void}
/>
```
Pure presentational. Owns no state.

---

## 11. Adding a New View

1. Create `src/views/NewView/NewView.tsx` + `NewView.module.css`
2. Add `<Route path="/newview" element={<NewView />} />` in `App.tsx`
3. Navigate with `useNavigate()`: `navigate('/newview')`
4. If it needs active stop: call `store.setActiveStopId(id)` before navigating
5. Guard: `useEffect(() => { if (!data) navigate('/'); }, [data]);`

---

## 12. Running & Deploying

```bash
# Development
npm run dev       # Vite dev server → http://localhost:5174

# Build for production
npm run build     # Output to dist/

# Preview production build locally
npm run preview
```

**GitHub Pages deploy:**
- Automated via GitHub Actions on every push to `main`.
- Requirement: Go to Repo Settings -> Pages -> Build and deployment -> Source: GitHub Actions.
- HashRouter means no server redirects needed (URLs use `/#/path`)

---

## 13. Progress Tracker

### ✅ Completed

| # | Task |
|---|---|
| 1 | Vite + React 18 + TypeScript scaffold |
| 2 | `zustand` + `react-router-dom` installed |
| 3 | `src/types/index.ts` — all shared interfaces |
| 4 | `src/api/geocoding.ts` — Nominatim |
| 5 | `src/api/routing.ts` — OSRM |
| 6 | `src/api/weather.ts` — Open-Meteo + WMO codes |
| 7 | `src/store/tripStore.ts` — Zustand with all actions |
| 8 | `src/hooks/useMousePosition.ts` |
| 9 | `src/hooks/useParticleEngine.ts` — full rAF engine |
| 10 | `src/styles/global.css` — design tokens + shared classes |
| 11 | `src/components/ParticleCanvas/ParticleCanvas.tsx` — EngineContext |
| 12 | `src/components/LocationInput/` — autocomplete component + CSS |
| 13 | `src/components/WeatherWidget/` — strip + grid + CSS |
| 14 | `src/components/RouteVisualizer/` — timeline component + CSS |
| 15 | `src/views/Home/` — Home view + CSS |
| 16 | `src/views/TripBuilder/` — TripBuilder + StopRow + CSS |
| 17 | `src/views/RouteViz/` — RouteViz + DetailPanel + CSS |
| 18 | `src/views/StopDetail/` — StopDetail + PlacesList + CSS |
| 19 | `src/App.tsx` + `src/main.tsx` |
| 20 | `vite.config.ts`, `netlify.toml`, `index.html` |
| 21 | `AGENTS.md` updated to v2 |
| 22 | Dev server running clean ✅ |

### 🔲 Future Work

| # | Task | Priority |
|---|---|---|
| F1 | Full-page itinerary / day-by-day schedule view | High |
| F2 | Share trip via URL (encode Zustand state as base64 hash) | High |
| F3 | Drag-to-reorder stops (react-beautiful-dnd or dnd-kit) | Medium |
| F4 | Place suggestions per stop via OSM Overpass API | Medium |
| F5 | Offline caching (Workbox service worker) | Low |
| F6 | Road condition alerts (TomTom free tier) | Low |
| F7 | Export itinerary as PDF | Low |

---

## 14. Coding Rules

1. **Strict TypeScript** — `any` is banned; define types in `src/types/index.ts`
2. **CSS Modules** per component/view — never inline styles
3. **Always use design tokens** — never hardcode colors, spacing, or font sizes
4. **Zustand selectors** — use `useTripStore((s) => s.fieldName)` for targeted subscriptions
5. **No direct DOM manipulation** — use refs + React state, never `document.querySelector`
6. **Route guards** — every view that depends on store state must redirect if missing
7. **API fallbacks** — all API functions must catch errors and return safe defaults
8. **`useEngine()` cleanup** — always return `() => unregisterEl(el)` from `useEffect`
9. **HashRouter** — never use BrowserRouter (breaks Netlify without redirect config)
10. **Parallel fetches** — always use `Promise.all` for OSRM + Weather, not sequential awaits
11. **Architecture Documentation** — If a task involves modifications to the architecture, data flow, or integration of new external APIs, you MUST update `architecture.md` to reflect those changes before finishing.

---

## 15. Agent Finishing Steps

**Before concluding any task**, an agent MUST run the following terminal commands to ensure code quality and build integrity:

1. **Linting**:
   ```bash
   npm run lint
   ```
   Fix any TypeScript or ESLint errors before proceeding. Do not ignore strict type errors.

2. **Testing**:
   ```bash
   npm run test
   ```
   Ensure no regressions were introduced.

3. **Production Build**:
   ```bash
   npm run build
   ```
   Verify that Vite successfully compiles the `dist/` output without throwing any TypeScript build errors (`tsc -b`).
