// src/App.tsx
// Root component: wraps everything in the ParticleCanvas + HashRouter.

import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ParticleCanvas } from './components/ParticleCanvas/ParticleCanvas';
import { Home }        from './views/Home/Home';
import { TripBuilder } from './views/TripBuilder/TripBuilder';
import { RouteViz }    from './views/RouteViz/RouteViz';
import { StopDetail }  from './views/StopDetail/StopDetail';
import { TripsDashboard } from './views/TripsDashboard/TripsDashboard';

export default function App() {
  return (
    <HashRouter>
      <ParticleCanvas>
        <Routes>
          <Route path="/start-planning" element={<Home />} />
          <Route path="/"        element={<Navigate to="/start-planning" replace />} />
          <Route path="/trips"   element={<TripsDashboard />} />
          <Route path="/builder" element={<TripBuilder />} />
          <Route path="/route"   element={<RouteViz />} />
          <Route path="/stop"    element={<StopDetail />} />
          <Route path="*"        element={<Navigate to="/" replace />} />
        </Routes>
      </ParticleCanvas>
    </HashRouter>
  );
}
