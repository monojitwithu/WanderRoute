// src/views/Home/Home.tsx

import { useNavigate } from 'react-router-dom';
import { useTripStore } from '../../store/tripStore';

import { FadeInView } from '../../components/ui/FadeInView/FadeInView';
import { Icon } from '../../components/ui/Icon/Icon';
import styles from './Home.module.css';

export function Home() {
  const navigate = useNavigate();
  const { trips, createTrip } = useTripStore();

  const handleStartPlanning = () => {
    createTrip('My Trip');
    navigate('/builder');
  };

  const hasTrips = Object.keys(trips).length > 0;

  return (
    <div className={styles.inner}>
      {hasTrips && (
        <button 
          className="btn-ghost" 
          style={{ position: 'absolute', top: 'var(--sp-6)', right: 'var(--sp-6)', zIndex: 100 }}
          onClick={() => navigate('/trips')}
        >
          Dashboard <Icon name="arrow-right" />
        </button>
      )}
      <FadeInView direction="down" className={styles.badge}>
        <span className={styles.badgeDot} />
        <span>Real-time Trip Planner</span>
      </FadeInView>

      <FadeInView delay={200}>
        <h1 className={styles.headline}>
          Plan Your<br />
          <span className={styles.accent}>Perfect Journey</span>
        </h1>
      </FadeInView>

      <FadeInView delay={400}>
        <p className={styles.sub}>
          Map your route, get live weather, and build<br />
          your itinerary — stop by stop.
        </p>
      </FadeInView>

      <FadeInView delay={600}>
        <div className={styles.ctaWrap}>
          <button className={styles.btn} onClick={handleStartPlanning} id="start-btn">
            <span>Start Planning</span>
            <Icon name="arrow-right" size={18} />
          </button>
        </div>
      </FadeInView>

      <FadeInView delay={800} className={styles.features}>
        {[
          { icon: '🛣️', label: 'Live Route Data' },
          { icon: '🌤️', label: 'Weather per Stop' },
          { icon: '📍', label: 'Add Places to Visit' },
        ].map(({ icon, label }) => (
          <div key={label} className={styles.chip}>
            <span>{icon}</span> {label}
          </div>
        ))}
      </FadeInView>
    </div>
  );
}
