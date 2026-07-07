import * as yup from 'yup';
import { useTripStore } from '../store/tripStore';

export const stopSchema = yup.object().shape({
  id: yup.string().required(),
  role: yup.string().oneOf(['start', 'stop', 'end']).required(),
  label: yup.string().required('Location is required'),
  lat: yup.number().nullable().required('Location must be valid'),
  lon: yup.number().nullable().required('Location must be valid'),
  departureTime: yup.string().required('Departure time is mandatory'),
  computedArrivalTime: yup.string().nullable(),
  places: yup.array().of(
    yup.object().shape({
      id: yup.string().required(),
      name: yup.string().required(),
      note: yup.string().optional(),
    })
  ).default([]),
});

export const titleSchema = yup.string()
  .trim()
  .required('Please provide a name for your trip.')
  .test('is-unique', 'A trip with this name already exists. Please choose a unique name.', function (value) {
    if (!value) return true;
    const store = useTripStore.getState();
    const isDuplicate = Object.values(store.trips).some(
      (t: any) => t.id !== store.activeTripId && t.title?.trim().toLowerCase() === value.toLowerCase()
    );
    return !isDuplicate;
  });

export const tripBuilderSchema = yup.object().shape({
  title: titleSchema,
  stops: yup.array().of(stopSchema)
    .min(2, 'At least a start and end location are required')
    .required(),
});
