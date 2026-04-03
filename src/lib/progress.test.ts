import { describe, it, expect } from 'vitest';
import { processWorkoutLogsToChartData, BIG3_LIFTS, generateProgramTimelineData, processWorkoutLogsToVolumeData } from './progress';

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

describe('generateProgramTimelineData', () => {
  const mockProgram = {
    id: 'prog-1',
    name: 'Test Program',
    totalWeeks: 4,
    daysPerWeek: 3,
  };

  const mockProgramWorkouts = [
    { id: 'pw-1-1', weekNumber: 1, dayNumber: 1, label: 'Day 1 - Squat' },
    { id: 'pw-1-2', weekNumber: 1, dayNumber: 2, label: 'Day 2 - Bench' },
    { id: 'pw-1-3', weekNumber: 1, dayNumber: 3, label: 'Day 3 - Deadlift' },
    { id: 'pw-2-1', weekNumber: 2, dayNumber: 1, label: 'Day 1 - Squat' },
    { id: 'pw-2-2', weekNumber: 2, dayNumber: 2, label: 'Day 2 - Bench' },
    { id: 'pw-2-3', weekNumber: 2, dayNumber: 3, label: 'Day 3 - Deadlift' },
    { id: 'pw-3-1', weekNumber: 3, dayNumber: 1, label: 'Day 1 - Squat' },
    { id: 'pw-3-2', weekNumber: 3, dayNumber: 2, label: 'Day 2 - Bench' },
    { id: 'pw-3-3', weekNumber: 3, dayNumber: 3, label: 'Day 3 - Deadlift' },
    { id: 'pw-4-1', weekNumber: 4, dayNumber: 1, label: 'Day 1 - Squat' },
    { id: 'pw-4-2', weekNumber: 4, dayNumber: 2, label: 'Day 2 - Bench' },
    { id: 'pw-4-3', weekNumber: 4, dayNumber: 3, label: 'Day 4 - Deadlift' },
  ];

  it('returns empty timeline when no workouts exist', () => {
    const result = generateProgramTimelineData(mockProgram, 1, [], []);
    
    expect(result.program).toEqual(mockProgram);
    expect(result.weeks).toHaveLength(4);
    expect(result.completionPercentage).toBe(0);
    expect(result.totalWorkouts).toBe(12);
    expect(result.completedWorkouts).toBe(0);
  });

  it('marks completed workouts correctly', () => {
    const workoutLogs = [
      {
        id: 'log-1',
        programWorkoutId: 'pw-1-1',
        completedAt: new Date('2024-01-08'),
        startedAt: new Date(),
        durationSeconds: 3600,
        sessionRpe: 7,
        totalSets: 5,
        totalVolume: 500,
      },
      {
        id: 'log-2',
        programWorkoutId: 'pw-1-2',
        completedAt: new Date('2024-01-09'),
        startedAt: new Date(),
        durationSeconds: 3000,
        sessionRpe: 6,
        totalSets: 4,
        totalVolume: 400,
      },
    ];

    const result = generateProgramTimelineData(mockProgram, 1, mockProgramWorkouts, workoutLogs);

    expect(result.completedWorkouts).toBe(2);
    expect(result.completionPercentage).toBe(Math.round((2 / 12) * 100));

    const week1 = result.weeks[0];
    expect(week1.days[0].status).toBe('completed');
    expect(week1.days[0].workoutLogId).toBe('log-1');
    expect(week1.days[0].totalSets).toBe(5);
    expect(week1.days[0].totalVolume).toBe(500);
    expect(week1.days[1].status).toBe('completed');
    expect(week1.days[2].status).toBe('current');
  });

  it('marks current day as current status', () => {
    const result = generateProgramTimelineData(mockProgram, 2, mockProgramWorkouts, []);

    const week1 = result.weeks[0];
    expect(week1.days[0].status).toBe('upcoming');
    expect(week1.days[1].status).toBe('upcoming');
    expect(week1.days[2].status).toBe('upcoming');

    const week2 = result.weeks[1];
    expect(week2.days[0].status).toBe('current');
    expect(week2.days[1].status).toBe('upcoming');
    expect(week2.days[2].status).toBe('upcoming');
  });

  it('marks future weeks as upcoming', () => {
    const result = generateProgramTimelineData(mockProgram, 1, mockProgramWorkouts, []);

    for (let weekNum = 2; weekNum <= 4; weekNum++) {
      const week = result.weeks[weekNum - 1];
      for (const day of week.days) {
        expect(day.status).toBe('upcoming');
      }
    }
  });

  it('marks all days completed when all workouts logged', () => {
    const workoutLogs = mockProgramWorkouts.map((pw, i) => ({
      id: `log-${i}`,
      programWorkoutId: pw.id,
      completedAt: new Date(),
      startedAt: new Date(),
      durationSeconds: 3600,
      sessionRpe: 7,
      totalSets: 5,
      totalVolume: 500,
    }));

    const result = generateProgramTimelineData(mockProgram, 1, mockProgramWorkouts, workoutLogs);

    expect(result.completedWorkouts).toBe(12);
    expect(result.completionPercentage).toBe(100);

    for (const week of result.weeks) {
      for (const day of week.days) {
        expect(day.status).toBe('completed');
      }
    }
  });

  it('preserves workout labels from programWorkouts', () => {
    const result = generateProgramTimelineData(mockProgram, 1, mockProgramWorkouts, []);

    const week1Day1 = result.weeks[0].days[0];
    expect(week1Day1.label).toBe('Day 1 - Squat');

    const week4Day3 = result.weeks[3].days[2];
    expect(week4Day3.label).toBe('Day 4 - Deadlift');
  });

  it('handles partial week completion', () => {
    const workoutLogs = [
      {
        id: 'log-1',
        programWorkoutId: 'pw-1-1',
        completedAt: new Date(),
        startedAt: new Date(),
        durationSeconds: 3600,
        sessionRpe: 7,
        totalSets: 5,
        totalVolume: 500,
      },
    ];

    const result = generateProgramTimelineData(mockProgram, 1, mockProgramWorkouts, workoutLogs);

    expect(result.completedWorkouts).toBe(1);
    expect(result.weeks[0].days[0].status).toBe('completed');
    expect(result.weeks[0].days[1].status).toBe('current');
  });
});

describe('processWorkoutLogsToVolumeData', () => {
  const volumeWorkoutLogs = [
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
          exercise: { name: 'Squat', muscleGroup: 'Legs' },
          actualWeight: 100,
          actualReps: 5,
          setNumber: 1,
          setType: 'working',
        },
        {
          id: 's2',
          exerciseId: 'ex2',
          exercise: { name: 'Bench Press', muscleGroup: 'Chest' },
          actualWeight: 80,
          actualReps: 8,
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
          id: 's3',
          exerciseId: 'ex1',
          exercise: { name: 'Squat', muscleGroup: 'Legs' },
          actualWeight: 110,
          actualReps: 5,
          setNumber: 1,
          setType: 'working',
        },
        {
          id: 's4',
          exerciseId: 'ex3',
          exercise: { name: 'Deadlift', muscleGroup: 'Back' },
          actualWeight: 140,
          actualReps: 3,
          setNumber: 1,
          setType: 'working',
        },
      ],
    },
  ];

  it('returns empty array when no workout logs provided', () => {
    const result = processWorkoutLogsToVolumeData([]);
    expect(result).toEqual([]);
  });

  it('calculates tonnage (weight * reps) per muscle group per week', () => {
    const result = processWorkoutLogsToVolumeData(volumeWorkoutLogs);

    expect(result).toHaveLength(2);

    expect(result[0].week).toBe(1);
    expect(result[0].muscleGroups['Legs']).toBe(500); // 100 * 5
    expect(result[0].muscleGroups['Chest']).toBe(640); // 80 * 8

    expect(result[1].week).toBe(2);
    expect(result[1].muscleGroups['Legs']).toBe(550); // 110 * 5
    expect(result[1].muscleGroups['Back']).toBe(420); // 140 * 3
  });

  it('sums multiple sets for same muscle group in same week', () => {
    const logs = [
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
            exercise: { name: 'Squat', muscleGroup: 'Legs' },
            actualWeight: 100,
            actualReps: 5,
            setNumber: 1,
            setType: 'working',
          },
          {
            id: 's2',
            exerciseId: 'ex1',
            exercise: { name: 'Squat', muscleGroup: 'Legs' },
            actualWeight: 100,
            actualReps: 5,
            setNumber: 2,
            setType: 'working',
          },
        ],
      },
    ];

    const result = processWorkoutLogsToVolumeData(logs);

    expect(result[0].muscleGroups['Legs']).toBe(1000); // 100*5 + 100*5
  });

  it('handles null weight or reps', () => {
    const logs = [
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
            exercise: { name: 'Squat', muscleGroup: 'Legs' },
            actualWeight: null,
            actualReps: 5,
            setNumber: 1,
            setType: 'working',
          },
          {
            id: 's2',
            exerciseId: 'ex2',
            exercise: { name: 'Bench Press', muscleGroup: 'Chest' },
            actualWeight: 80,
            actualReps: null,
            setNumber: 1,
            setType: 'working',
          },
          {
            id: 's3',
            exerciseId: 'ex3',
            exercise: { name: 'Deadlift', muscleGroup: 'Back' },
            actualWeight: 100,
            actualReps: 5,
            setNumber: 1,
            setType: 'working',
          },
        ],
      },
    ];

    const result = processWorkoutLogsToVolumeData(logs);

    expect(result[0].muscleGroups['Legs']).toBeUndefined();
    expect(result[0].muscleGroups['Chest']).toBeUndefined();
    expect(result[0].muscleGroups['Back']).toBe(500); // 100 * 5
  });

  it('sorts results by week ascending', () => {
    const result = processWorkoutLogsToVolumeData(volumeWorkoutLogs);

    expect(result[0].week).toBe(1);
    expect(result[1].week).toBe(2);
  });

  it('calculates week-over-week change correctly', () => {
    const result = processWorkoutLogsToVolumeData(volumeWorkoutLogs);

    expect(result[0].weekOverWeek).toBeNull(); // First week has no previous
    // Week 2 total (970) vs Week 1 total (1140): (970 - 1140) / 1140 = -0.149
    expect(result[1].weekOverWeek).toBeCloseTo(-0.149, 2);
  });

  it('calculates total volume per week', () => {
    const result = processWorkoutLogsToVolumeData(volumeWorkoutLogs);

    expect(result[0].totalVolume).toBe(1140); // 500 + 640
    expect(result[1].totalVolume).toBe(970); // 550 + 420
  });

  it('handles muscle groups with null values', () => {
    const logs = [
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
            exercise: { name: 'Squat', muscleGroup: null },
            actualWeight: 100,
            actualReps: 5,
            setNumber: 1,
            setType: 'working',
          },
        ],
      },
    ];

    const result = processWorkoutLogsToVolumeData(logs);

    expect(result[0].muscleGroups['null']).toBe(500);
  });
});
