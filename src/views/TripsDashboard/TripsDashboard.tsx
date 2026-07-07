// src/views/TripsDashboard/TripsDashboard.tsx
// Dashboard to manage multiple saved trips.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as yup from 'yup';
import { useTripStore } from '../../store/tripStore';
import { titleSchema } from '../../schemas/tripBuilderSchema';
import { GlassCard } from '../../components/ui/GlassCard/GlassCard';
import { Icon } from '../../components/ui/Icon/Icon';
import { IconButton } from '../../components/ui/IconButton/IconButton';
import { FadeInView } from '../../components/ui/FadeInView/FadeInView';
import styles from './TripsDashboard.module.css';

export function TripsDashboard() {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const { trips, createTrip, loadTrip, deleteTrip } = useTripStore();
  
  const tripList = Object.values(trips);

  function handleCreateNew(title: string) {
    createTrip(title.trim());
    navigate('/builder');
  }

  function handleOpenTrip(id: string) {
    loadTrip(id);
    const trip = trips[id];
    const isReady = trip.stops.length >= 2 && trip.stops[0].lat && trip.stops[trip.stops.length - 1].lat;
    navigate(isReady ? '/route' : '/builder');
  }

  function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this trip?')) {
      deleteTrip(id);
    }
  }

  return (
    <div className={`${styles.inner} scrollable`}>
      <FadeInView direction="down" className={styles.header}>
        <button className="btn-ghost" onClick={() => navigate('/')}>
          <Icon name="arrow-left" />
          Home
        </button>
        <div>
          <h2 className={styles.title}>My Trips</h2>
          <p className={styles.sub}>Manage and plan your adventures</p>
        </div>
      </FadeInView>

      <div className={styles.grid}>
        {tripList.map((trip, i) => (
          <FadeInView key={trip.id} direction="up" delay={i * 50} className={styles.fadeWrap}>
            <GlassCard
              className={styles.tripCard}
              focusHighlight
            >
              <div className={styles.cardClickable} onClick={() => handleOpenTrip(trip.id)}>
                <h3 className={styles.tripTitle}>{trip.title}</h3>
                <p className={styles.tripMeta}>
                  {trip.stops.length} stops • {trip.stops[0]?.label || 'Start'} → {trip.stops[trip.stops.length - 1]?.label || 'End'}
                </p>
                <div className={styles.dates}>
                  {trip.stops[0]?.departureTime && new Date(trip.stops[0].departureTime).toLocaleDateString()}
                </div>
              </div>
              <IconButton
                icon="x"
                variant="danger"
                className={styles.deleteBtn}
                onClick={(e) => handleDelete(trip.id, e)}
                title="Delete Trip"
              />
            </GlassCard>
          </FadeInView>
        ))}

        {isCreating ? (
          <FadeInView direction="up" delay={tripList.length * 50} className={styles.fadeWrap}>
            <GlassCard className={styles.tripCard}>
              <div style={{ padding: 'var(--sp-6)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)', justifyContent: 'center' }}>
                <h3 className={styles.tripTitle} style={{ textAlign: 'center' }}>Name Your Trip</h3>
              <Formik
                initialValues={{ title: '' }}
                validationSchema={yup.object({ title: titleSchema })}
                onSubmit={(values) => handleCreateNew(values.title)}
              >
                {({ isSubmitting, errors, touched, handleChange, handleBlur, values }) => (
                  <Form style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)', width: '100%' }}>
                    <input
                      name="title"
                      placeholder="e.g. Summer in Kerala"
                      className="input-field"
                      autoFocus
                      value={values.title}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                    {touched.title && errors.title && <p style={{ color: 'var(--clr-danger)', fontSize: 'var(--fs-sm)', textAlign: 'center' }}>{errors.title as string}</p>}
                    <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                      <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ flex: 1, padding: 'var(--sp-2)' }}>Start</button>
                      <button type="button" className="btn-ghost" onClick={() => setIsCreating(false)} style={{ flex: 1, padding: 'var(--sp-2)' }}>Cancel</button>
                    </div>
                  </Form>
                )}
              </Formik>
              </div>
            </GlassCard>
          </FadeInView>
        ) : (
          <FadeInView direction="up" delay={tripList.length * 50} className={styles.fadeWrap}>
            <div className={styles.createCard} onClick={() => setIsCreating(true)}>
              <div className={styles.createIcon}>
                <Icon name="plus" />
              </div>
              <h3>Plan a New Trip</h3>
            </div>
          </FadeInView>
        )}
      </div>
    </div>
  );
}
