import { describe, it, expect } from 'vitest';
import { processWorkoutLogsToChartData, BIG3_LIFTS } from './progress';

describe('processWorkoutLogsToChartData', () => {
  it('returns empty array when no workout logs provided', () => {
    const result = processWorkoutLogsToChartData([]);
    expect(result).toEqual([]);
  });

  it('groups workouts by week number', () => {
    const workoutLogs = [
      {
        id: 'wl1',
        completedAt: new Date('2024-01-08'),
        cycleId: 'cycle1',
        programWorkoutId: 'pw1',
        startedAt: new Date(),
        cycle: { currentWeek: 2 },
        sets: [
          {
            id: 's1',
            exerciseId: 'ex1',
            exercise: { name: 'Squat' },
            actualWeight: 100,
            actualReps: 5,
            setNumber: 1,
            setType: 'working',
          },
        ],
      },
      {
        id: 'wl2',
        completedAt: new Date('2024-01-15'),
        cycleId: 'cycle1',
        programWorkoutId: 'pw2',
        startedAt: new Date(),
        cycle: { currentWeek: 3 },
        sets: [
          {
            id: 's2',
            exerciseId: 'ex1',
            exercise: { name: 'Squat' },
            actualWeight: 105,
            actualReps: 5,
            setNumber: 1,
            setType: 'working',
          },
        ],
      },
    ];

    const result = processWorkoutLogsToChartData(workoutLogs);

    expect(result).toHaveLength(2);
    expect(result[0].week).toBe(2);
    expect(result[1].week).toBe(3);
  });

  it('calculates estimated 1RM for each lift using Epley formula', () => {
    const workoutLogs = [
      {
        id: 'wl1',
        completedAt: new Date('2024-01-08'),
        cycleId: 'cycle1',
        programWorkoutId: 'pw1',
        startedAt: new Date(),
        cycle: { currentWeek: 1 },
        sets: [
          {
            id: 's1',
            exerciseId: 'ex1',
            exercise: { name: 'Squat' },
            actualWeight: 100,
            actualReps: 5,
            setNumber: 1,
            setType: 'working',
          },
          {
            id: 's2',
            exerciseId: 'ex1',
            exercise: { name: 'Squat' },
            actualWeight: 100,
            actualReps: 3,
            setNumber: 2,
            setType: 'working',
          },
        ],
      },
    ];

    const result = processWorkoutLogsToChartData(workoutLogs);

    // Epley: 100 * (1 + 5/30) = 116.666...
    expect(result[0].squat).toBeCloseTo(116.67, 1);
  });

  it('finds the best set (highest estimated 1RM) per workout per lift', () => {
    const workoutLogs = [
      {
        id: 'wl1',
        completedAt: new Date('2024-01-08'),
        cycleId: 'cycle1',
        programWorkoutId: 'pw1',
        startedAt: new Date(),
        cycle: { currentWeek: 1 },
        sets: [
          {
            id: 's1',
            exerciseId: 'ex1',
            exercise: { name: 'Squat' },
            actualWeight: 100,
            actualReps: 5,
            setNumber: 1,
            setType: 'working',
          },
          {
            id: 's2',
            exerciseId: 'ex1',
            exercise: { name: 'Squat' },
            actualWeight: 110,
            actualReps: 1,
            setNumber: 2,
            setType: 'working',
          },
        ],
      },
    ];

    const result = processWorkoutLogsToChartData(workoutLogs);

    // Best set is 110 * (1 + 1/30) = 113.67 (not the 5-rep set which is 116.67)
    // Actually wait - 100 * (1 + 5/30) = 116.67 vs 110 * (1 + 1/30) = 113.67
    // So the 5-rep set at 100kg is actually better
    expect(result[0].squat).toBeCloseTo(116.67, 1);
  });

  it('marks PR when a lift exceeds the previous best', () => {
    const workoutLogs = [
      {
        id: 'wl1',
        completedAt: new Date('2024-01-08'),
        cycleId: 'cycle1',
        programWorkoutId: 'pw1',
        startedAt: new Date(),
        cycle: { currentWeek: 1 },
        sets: [
          {
            id: 's1',
            exerciseId: 'ex1',
            exercise: { name: 'Squat' },
            actualWeight: 100,
            actualReps: 5,
            setNumber: 1,
            setType: 'working',
          },
        ],
      },
      {
        id: 'wl2',
        completedAt: new Date('2024-01-15'),
        cycleId: 'cycle1',
        programWorkoutId: 'pw2',
        startedAt: new Date(),
        cycle: { currentWeek: 2 },
        sets: [
          {
            id: 's2',
            exerciseId: 'ex1',
            exercise: { name: 'Squat' },
            actualWeight: 110,
            actualReps: 5,
            setNumber: 1,
            setType: 'working',
          },
        ],
      },
    ];

    const result = processWorkoutLogsToChartData(workoutLogs);

    // Week 1: squat = 116.67, PR = false (no previous)
    expect(result[0].squat).toBeCloseTo(116.67, 1);
    expect(result[0].squatPR).toBe(false);

    // Week 2: squat = 110 * (1 + 5/30) = 128.33, PR = true (beats 116.67)
    expect(result[1].squat).toBeCloseTo(128.33, 1);
    expect(result[1].squatPR).toBe(true);
  });

  it('handles missing lifts in a week (null values)', () => {
    const workoutLogs = [
      {
        id: 'wl1',
        completedAt: new Date('2024-01-08'),
        cycleId: 'cycle1',
        programWorkoutId: 'pw1',
        startedAt: new Date(),
        cycle: { currentWeek: 1 },
        sets: [
          {
            id: 's1',
            exerciseId: 'ex1',
            exercise: { name: 'Squat' },
            actualWeight: 100,
            actualReps: 5,
            setNumber: 1,
            setType: 'working',
          },
        ],
      },
    ];

    const result = processWorkoutLogsToChartData(workoutLogs);

    expect(result[0].squat).toBeCloseTo(116.67, 1);
    expect(result[0].bench).toBeNull();
    expect(result[0].deadlift).toBeNull();
  });

  it('only processes Big 3 lifts', () => {
    const workoutLogs = [
      {
        id: 'wl1',
        completedAt: new Date('2024-01-08'),
        cycleId: 'cycle1',
        programWorkoutId: 'pw1',
        startedAt: new Date(),
        cycle: { currentWeek: 1 },
        sets: [
          {
            id: 's1',
            exerciseId: 'ex1',
            exercise: { name: 'Squat' },
            actualWeight: 100,
            actualReps: 5,
            setNumber: 1,
            setType: 'working',
          },
          {
            id: 's2',
            exerciseId: 'ex2',
            exercise: { name: 'Barbell Row' },
            actualWeight: 80,
            actualReps: 8,
            setNumber: 1,
            setType: 'working',
          },
        ],
      },
    ];

    const result = processWorkoutLogsToChartData(workoutLogs);

    expect(result[0].squat).toBeCloseTo(116.67, 1);
    expect(result[0].bench).toBeNull();
    expect(result[0].deadlift).toBeNull();
    // Barbell Row is not a Big 3 lift, so only Squat should have a value
  });

  it('sorts results by week ascending', () => {
    const workoutLogs = [
      {
        id: 'wl2',
        completedAt: new Date('2024-01-15'),
        cycleId: 'cycle1',
        programWorkoutId: 'pw2',
        startedAt: new Date(),
        cycle: { currentWeek: 3 },
        sets: [
          {
            id: 's2',
            exerciseId: 'ex1',
            exercise: { name: 'Squat' },
            actualWeight: 105,
            actualReps: 5,
            setNumber: 1,
            setType: 'working',
          },
        ],
      },
      {
        id: 'wl1',
        completedAt: new Date('2024-01-08'),
        cycleId: 'cycle1',
        programWorkoutId: 'pw1',
        startedAt: new Date(),
        cycle: { currentWeek: 1 },
        sets: [
          {
            id: 's1',
            exerciseId: 'ex1',
            exercise: { name: 'Squat' },
            actualWeight: 100,
            actualReps: 5,
            setNumber: 1,
            setType: 'working',
          },
        ],
      },
    ];

    const result = processWorkoutLogsToChartData(workoutLogs);

    expect(result[0].week).toBe(1);
    expect(result[1].week).toBe(3);
  });

  it('handles workouts with no working sets', () => {
    const workoutLogs = [
      {
        id: 'wl1',
        completedAt: new Date('2024-01-08'),
        cycleId: 'cycle1',
        programWorkoutId: 'pw1',
        startedAt: new Date(),
        cycle: { currentWeek: 1 },
        sets: [
          {
            id: 's1',
            exerciseId: 'ex1',
            exercise: { name: 'Squat' },
            actualWeight: 50,
            actualReps: 10,
            setNumber: 1,
            setType: 'warmup',
          },
        ],
      },
    ];

    const result = processWorkoutLogsToChartData(workoutLogs);

    // Warmup set: 50 * (1 + 10/30) = 66.67
    expect(result[0].squat).toBeCloseTo(66.67, 1);
  });

  it('handles workouts where actualWeight or actualReps is null', () => {
    const workoutLogs = [
      {
        id: 'wl1',
        completedAt: new Date('2024-01-08'),
        cycleId: 'cycle1',
        programWorkoutId: 'pw1',
        startedAt: new Date(),
        cycle: { currentWeek: 1 },
        sets: [
          {
            id: 's1',
            exerciseId: 'ex1',
            exercise: { name: 'Squat' },
            actualWeight: null,
            actualReps: 5,
            setNumber: 1,
            setType: 'working',
          },
          {
            id: 's2',
            exerciseId: 'ex2',
            exercise: { name: 'Bench Press' },
            actualWeight: 100,
            actualReps: null,
            setNumber: 1,
            setType: 'working',
          },
        ],
      },
    ];

    const result = processWorkoutLogsToChartData(workoutLogs);

    // Workout exists for week 1, but both lifts have missing data
    expect(result).toHaveLength(1);
    expect(result[0].week).toBe(1);
    expect(result[0].squat).toBeNull();
    expect(result[0].bench).toBeNull();
    expect(result[0].deadlift).toBeNull();
  });
});

describe('BIG3_LIFTS', () => {
  it('contains Squat, Bench Press, and Deadlift', () => {
    expect(BIG3_LIFTS).toContain('Squat');
    expect(BIG3_LIFTS).toContain('Bench Press');
    expect(BIG3_LIFTS).toContain('Deadlift');
  });
});
