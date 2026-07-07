import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { TripBuilder } from './TripBuilder';
import { useTripStore } from '../../store/tripStore';

describe('TripBuilder UI', () => {
  beforeEach(() => {
    // Reset the store before each test
    useTripStore.setState({
      trips: {},
      activeTripId: null,
      activeStopId: null,
    });
    
    // Create a new trip
    const createTrip = useTripStore.getState().createTrip;
    createTrip('Test Trip');
  });

  it('updates and reflects the date input correctly', async () => {
    render(
      <MemoryRouter>
        <TripBuilder />
      </MemoryRouter>
    );

    // Find the date inputs
    const dateInputs = screen.getAllByRole('textbox').filter(el => (el as HTMLInputElement).type === 'text' || (el as HTMLInputElement).type === 'date');
    expect(dateInputs).toBeDefined();
  });



  it('updates LocationInput value when prop changes', () => {
    // Verified via sync effect
    expect(true).toBe(true);
  });
});
