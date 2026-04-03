import { describe, it, expect } from 'vitest';
import { formatDuration, calculateWorkoutTotalVolume, type WorkoutHistoryItem } from './history';

describe('formatDuration', () => {
  it('returns "0m" for 0 seconds', () => {
    expect(formatDuration(0)).toBe('0m');
  });

  it('returns "0m" for null', () => {
    expect(formatDuration(null)).toBe('0m');
  });

  it('formats seconds into minutes', () => {
    expect(formatDuration(60)).toBe('1m');
    expect(formatDuration(90)).toBe('2m');
    expect(formatDuration(300)).toBe('5m');
  });

  it('formats minutes into hours and minutes', () => {
    expect(formatDuration(3600)).toBe('1h 0m');
    expect(formatDuration(3660)).toBe('1h 1m');
    expect(formatDuration(3900)).toBe('1h 5m');
    expect(formatDuration(5400)).toBe('1h 30m');
    expect(formatDuration(7200)).toBe('2h 0m');
    expect(formatDuration(9000)).toBe('2h 30m');
  });

  it('formats 90 minutes correctly', () => {
    expect(formatDuration(5400)).toBe('1h 30m');
  });

  it('formats 75 minutes correctly', () => {
    expect(formatDuration(4500)).toBe('1h 15m');
  });

  it('returns "0m" for negative values', () => {
    expect(formatDuration(-100)).toBe('0m');
  });

  it('handles large values', () => {
    expect(formatDuration(10800)).toBe('3h 0m');
    expect(formatDuration(14400)).toBe('4h 0m');
  });
});

describe('calculateWorkoutTotalVolume', () => {
  const createSet = (weight: number | null, reps: number | null): WorkoutHistoryItem['sets'][0] => ({
    id: 'set-1',
    exerciseId: 'ex-1',
    exercise: { name: 'Squat' },
    setNumber: 1,
    setType: 'working',
    actualWeight: weight,
    actualReps: reps,
    rpe: null,
  });

  it('returns 0 for empty array', () => {
    expect(calculateWorkoutTotalVolume([])).toBe(0);
  });

  it('calculates volume for valid sets', () => {
    const sets = [
      createSet(100, 5),
      createSet(80, 8),
      createSet(60, 10),
    ];
    expect(calculateWorkoutTotalVolume(sets)).toBe(1740); // 100*5 + 80*8 + 60*10
  });

  it('skips sets with null weight', () => {
    const sets = [
      createSet(100, 5),
      createSet(null, 5),
      createSet(80, 8),
    ];
    expect(calculateWorkoutTotalVolume(sets)).toBe(1140); // 100*5 + 80*8
  });

  it('skips sets with null reps', () => {
    const sets = [
      createSet(100, 5),
      createSet(100, null),
      createSet(80, 8),
    ];
    expect(calculateWorkoutTotalVolume(sets)).toBe(1140); // 100*5 + 80*8
  });

  it('skips sets with both null weight and reps', () => {
    const sets = [
      createSet(100, 5),
      createSet(null, null),
      createSet(80, 8),
    ];
    expect(calculateWorkoutTotalVolume(sets)).toBe(1140); // 100*5 + 80*8
  });

  it('handles single set', () => {
    const sets = [createSet(140, 3)];
    expect(calculateWorkoutTotalVolume(sets)).toBe(420); // 140*3
  });

  it('handles decimal weights', () => {
    const sets = [createSet(82.5, 5)];
    expect(calculateWorkoutTotalVolume(sets)).toBe(412.5); // 82.5*5
  });
});
