// src/views/TripBuilder/TripBuilder.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, FieldArray, Form } from 'formik';
import { useTripStore } from '../../store/tripStore';
import { getRoute } from '../../api/routing';
import { fetchAllStopWeather, getPlaceWeather } from '../../api/weather';
import { StopRow } from './StopRow';
import { FadeInView } from '../../components/ui/FadeInView/FadeInView';
import { Icon } from '../../components/ui/Icon/Icon';
import styles from './TripBuilder.module.css';
import { tripBuilderSchema } from '../../schemas/tripBuilderSchema';
import { createStop } from '../../store/tripStore';



export function TripBuilder() {
  const navigate = useNavigate();
  const activeTrip = useTripStore((s) => (s.activeTripId ? s.trips[s.activeTripId] : null));
  const stops = activeTrip?.stops ?? [];
  const { setSegments, setWeather } = useTripStore();

  useEffect(() => {
    if (activeTrip && stops.length === 0) {
      useTripStore.getState().addStop('start');
      useTripStore.getState().addStop('end');
    }
  }, [activeTrip, stops.length]);

  return (
    <div className={styles.inner}>
      <Formik
        initialValues={{ title: activeTrip?.title || '', stops }}
        validationSchema={tripBuilderSchema}
        onSubmit={async (values, { setSubmitting, setStatus }) => {
          setStatus(null);
          
          const { setTripStops, updateTripTitle, activeTripId } = useTripStore.getState();
          setTripStops(values.stops);
          if (activeTripId && values.title !== undefined) {
            updateTripTitle(activeTripId, values.title);
          }

          try {
            const [segs, wx, updatedStops] = await Promise.all([
              getRoute(values.stops),
              fetchAllStopWeather(values.stops),
              Promise.all(values.stops.map(async (stop: any) => {
                if (!stop.lat || !stop.lon || stop.places.length === 0) return stop;
                const newPlaces = await Promise.all(stop.places.map(async (p: any) => {
                  if (!p.lat || !p.lon) return p;
                  const weatherPromise = getPlaceWeather(p.lat, p.lon);
                  const routePromise = getRoute([{ lat: stop.lat, lon: stop.lon } as any, { lat: p.lat, lon: p.lon } as any]);
                  const [weather, routeSegs] = await Promise.all([weatherPromise, routePromise]);
                  return {
                    ...p,
                    weather: weather || p.weather,
                    travelTimeHr: routeSegs.length > 0 ? routeSegs[0].durationHr : p.travelTimeHr
                  };
                }));
                return { ...stop, places: newPlaces };
              }))
            ]);
            
            setTripStops(updatedStops);
            setSegments(segs);
            setWeather(wx);
            navigate('/route');
          } catch {
            setStatus('Could not load route. Check your connection and try again.');
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ values, isSubmitting, status, setFieldTouched, errors, touched, handleChange, handleBlur }) => (
          <Form className={styles.formWrap}>
            <FadeInView direction="down" className={styles.header}>
              <button type="button" className="btn-ghost" onClick={() => navigate('/start-planning')}>
                <Icon name="arrow-left" /> Back
              </button>
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center' }}>
                <input
                  name="title"
                  className={styles.titleInput}
                  value={values.title}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Name your trip..."
                />
                {touched.title && errors.title && <p className={styles.errorText} style={{ textAlign: 'center' }}>{errors.title as string}</p>}
                <p className={styles.sub}>Add your start, stops, and destination</p>
              </div>
            </FadeInView>
            
            <FieldArray name="stops">
              {({ remove, push }) => (
                <>
                  <div className={`${styles.scrollArea} scrollable`}>
                    <div className={styles.stopsList}>
                      {values.stops.map((stop: any, i: number) => (
                        <FadeInView key={stop.id} direction="up" delay={i * 50}>
                          <StopRow
                            stop={stop}
                            index={i}
                            onRemove={stop.role === 'stop' ? () => remove(i) : undefined}
                          />
                        </FadeInView>
                      ))}
                    </div>
                  </div>

                  <div className={styles.stickyFooter}>
                    {values.stops.length < 10 && (
                      <div style={{ width: '100%' }}>
                        <FadeInView direction="up" delay={values.stops.length * 50}>
                          <button 
                            type="button" 
                            className={styles.addStopBtn} 
                            onClick={() => {
                            const newStop = createStop('stop');
                            const endStop = values.stops[values.stops.length - 1];
                            remove(values.stops.length - 1);
                            push(newStop);
                            push(endStop);
                          }}
                        >
                          <span className={styles.addPlus}>+</span>
                          Add a stop
                        </button>
                      </FadeInView>
                      </div>
                    )}

                    {status && <p className={styles.error}>⚠️ {status}</p>}

                    <FadeInView direction="up" delay={(values.stops.length + 1) * 50}>
                      <div style={{ display: 'flex', width: '100%' }}>
                        <button 
                          type="submit" 
                          className="btn-primary" 
                          style={{ width: '100%', justifyContent: 'center' }}
                          disabled={isSubmitting}
                          onClick={() => {
                            // Manually touch all fields on submit attempt so errors show up
                            values.stops.forEach((_, i) => {
                              setFieldTouched(`stops.${i}.label`, true, true);
                              setFieldTouched(`stops.${i}.lat`, true, true);
                              setFieldTouched(`stops.${i}.departureTime`, true, true);
                            });
                          }}
                        >
                          {isSubmitting ? 'Loading…' : 'Visualise'}
                          {!isSubmitting && <Icon name="arrow-right" />}
                        </button>
                      </div>
                    </FadeInView>
                  </div>
                </>
              )}
            </FieldArray>
          </Form>
        )}
      </Formik>
    </div>
  );
}
