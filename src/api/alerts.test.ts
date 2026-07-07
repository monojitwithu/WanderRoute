import { describe, it, expect } from 'vitest';
import { generateAlertsForTrip } from './alerts';
import type { Trip } from '../types';

describe('Weather Alerts Generator', () => {
  const createMockTrip = (
    arrival: string | null,
    departure: string,
    forecasts: { date: string; weatherCode: number; label: string }[]
  ): Trip => {
    return {
      id: 'trip1',
      title: 'Test Trip',
      stops: [
        {
          id: 'stop1',
          role: 'stop',
          label: 'Varkala',
          lat: 8.7,
          lon: 76.7,
          departureTime: departure,
          computedArrivalTime: arrival,
          places: [],
        },
      ],
      segments: [],
      weather: {
        stop1: forecasts.map(f => ({
          ...f,
          maxTemp: 30,
          minTemp: 25,
          precipitation: 0,
          icon: '☁️',
        })),
      },
    };
  };

  it('should generate a Red Alert for thunderstorm with severe hail (code 99) during the stay', () => {
    const trip = createMockTrip(
      '2024-07-08T10:00', // Arrive July 8, 10am
      '2024-07-10T15:00', // Depart July 10, 3pm
      [
        { date: '2024-07-09', weatherCode: 99, label: 'Thunderstorm with hail' },
      ]
    );

    const alerts = generateAlertsForTrip(trip);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe('danger');
    expect(alerts[0].message).toContain('Red Alert');
    expect(alerts[0].message).toContain('Thunderstorm with hail');
  });

  it('should generate a Yellow Alert for heavy rain (code 65) during the stay', () => {
    const trip = createMockTrip(
      '2024-07-08T10:00',
      '2024-07-10T15:00',
      [
        { date: '2024-07-10', weatherCode: 65, label: 'Heavy Rain' },
      ]
    );

    const alerts = generateAlertsForTrip(trip);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe('warning');
    expect(alerts[0].message).toContain('Yellow Alert');
  });

  it('should NOT generate an alert if the severe weather is OUTSIDE the stay duration', () => {
    const trip = createMockTrip(
      '2024-07-08T10:00', // Arrive July 8
      '2024-07-09T15:00', // Depart July 9
      [
        { date: '2024-07-07', weatherCode: 99, label: 'Severe Thunderstorm' }, // Before arrival
        { date: '2024-07-10', weatherCode: 99, label: 'Severe Thunderstorm' }, // After departure
      ]
    );

    const alerts = generateAlertsForTrip(trip);
    expect(alerts).toHaveLength(0);
  });

  it('should NOT generate an alert for benign weather codes', () => {
    const trip = createMockTrip(
      '2024-07-08T10:00',
      '2024-07-10T15:00',
      [
        { date: '2024-07-09', weatherCode: 1, label: 'Clear' },
        { date: '2024-07-10', weatherCode: 3, label: 'Overcast' },
      ]
    );

    const alerts = generateAlertsForTrip(trip);
    expect(alerts).toHaveLength(0);
  });
});
