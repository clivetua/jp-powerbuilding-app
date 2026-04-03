import { describe, it, expect } from 'vitest';
import { formatDuration } from './history';

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
