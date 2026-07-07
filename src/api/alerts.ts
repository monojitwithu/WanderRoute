// src/api/alerts.ts
// Generates simulated live alerts based on Open-Meteo data and placeholders for traffic.

import type { Trip, Alert, DayForecast } from '../types';

function generateId(): string {
  return `alert_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
}

export function generateAlertsForTrip(trip: Trip): Alert[] {
  const alerts: Alert[] = [];

  // 1. Analyze Weather (Yellow/Red Alerts based on extreme weather codes)
  // WMO Codes:
  // 65: Heavy Rain
  // 75: Heavy Snow
  // 95: Thunderstorm
  // 96, 99: Thunderstorm with severe hail
  trip.stops.forEach((stop) => {
    const forecast = trip.weather[stop.id];
    if (!forecast) return;

    // Determine the relevant date range for this stop
    const arrival = stop.computedArrivalTime ? new Date(stop.computedArrivalTime) : null;
    const departure = new Date(stop.departureTime);

    forecast.forEach((day: DayForecast) => {
      const dayDate = new Date(day.date);
      // Check if this forecast day overlaps with the stay duration
      const isDuringStay =
        (!arrival || dayDate >= new Date(arrival.setHours(0,0,0,0))) &&
        (dayDate <= new Date(departure.setHours(23,59,59,999)));

      if (isDuringStay) {
        if ([96, 99, 75].includes(day.weatherCode)) {
          alerts.push({
            id: generateId(),
            severity: 'danger',
            message: `Red Alert: Severe weather (${day.label}) expected in ${stop.label} on ${dayDate.toLocaleDateString()}.`,
            source: 'Weather',
            stopId: stop.id,
          });
        } else if ([65, 95].includes(day.weatherCode)) {
          alerts.push({
            id: generateId(),
            severity: 'warning',
            message: `Yellow Alert: ${day.label} predicted in ${stop.label} on ${dayDate.toLocaleDateString()}. Prepare for travel delays.`,
            source: 'Weather',
            stopId: stop.id,
          });
        }
      }
    });
  });

  return alerts;
}
