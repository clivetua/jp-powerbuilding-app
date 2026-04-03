import { estimateOneRepMax } from './calculations';

const BIG3_LIFTS = ['Squat', 'Bench Press', 'Deadlift'] as const;

export type Big3Lift = typeof BIG3_LIFTS[number];

export type ChartDataPoint = {
  week: number;
  squat: number | null;
  bench: number | null;
  deadlift: number | null;
  squatPR: boolean;
  benchPR: boolean;
  deadliftPR: boolean;
};

type SetLogData = {
  id: string;
  exerciseId: string;
  exercise: { name: string };
  actualWeight: number | null;
  actualReps: number | null;
  setNumber: number;
  setType: string;
};

type WorkoutLogData = {
  id: string;
  completedAt: Date | null;
  cycleId: string;
  programWorkoutId: string;
  startedAt: Date;
  cycle: { currentWeek: number };
  sets: SetLogData[];
};

export function processWorkoutLogsToChartData(
  workoutLogs: WorkoutLogData[]
): ChartDataPoint[] {
  if (workoutLogs.length === 0) {
    return [];
  }

  const liftKeyMap: Record<Big3Lift, 'squat' | 'bench' | 'deadlift'> = {
    'Squat': 'squat',
    'Bench Press': 'bench',
    'Deadlift': 'deadlift',
  };

  const weekMap = new Map<number, {
    workoutLog: WorkoutLogData;
    best1RM: { squat: number | null; bench: number | null; deadlift: number | null };
  }>();

  for (const workoutLog of workoutLogs) {
    const week = workoutLog.cycle.currentWeek;
    let existing = weekMap.get(week);

    if (!existing) {
      existing = {
        workoutLog,
        best1RM: { squat: null, bench: null, deadlift: null },
      };
      weekMap.set(week, existing);
    }

    for (const set of workoutLog.sets) {
      const exerciseName = set.exercise.name;
      if (!BIG3_LIFTS.includes(exerciseName as Big3Lift)) {
        continue;
      }

      const liftKey = liftKeyMap[exerciseName as Big3Lift];
      const weight = set.actualWeight;
      const reps = set.actualReps;

      if (weight === null || reps === null) {
        continue;
      }

      const estimated1RM = estimateOneRepMax(weight, reps);
      const currentBest = existing.best1RM[liftKey];
      if (currentBest === null || estimated1RM > currentBest) {
        existing.best1RM[liftKey] = estimated1RM;
      }
    }
  }

  const sortedWeeks = Array.from(weekMap.keys()).sort((a, b) => a - b);

  const result: ChartDataPoint[] = [];
  const previousBest: { squat: number | null; bench: number | null; deadlift: number | null } = {
    squat: null,
    bench: null,
    deadlift: null,
  };

  for (const week of sortedWeeks) {
    const weekData = weekMap.get(week)!;
    const squat = weekData.best1RM.squat;
    const bench = weekData.best1RM.bench;
    const deadlift = weekData.best1RM.deadlift;

    result.push({
      week,
      squat,
      bench,
      deadlift,
      squatPR: squat !== null && previousBest.squat !== null && squat > previousBest.squat,
      benchPR: bench !== null && previousBest.bench !== null && bench > previousBest.bench,
      deadliftPR: deadlift !== null && previousBest.deadlift !== null && deadlift > previousBest.deadlift,
    });

    if (squat !== null) previousBest.squat = squat;
    if (bench !== null) previousBest.bench = bench;
    if (deadlift !== null) previousBest.deadlift = deadlift;
  }

  return result;
}
