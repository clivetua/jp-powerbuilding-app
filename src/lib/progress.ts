import { estimateOneRepMax } from './calculations';

export const BIG3_LIFTS = ['Squat', 'Bench Press', 'Deadlift'] as const;

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

type WorkoutLogDataInternal = {
  id: string;
  completedAt: Date | null;
  cycleId: string;
  programWorkoutId: string;
  startedAt: Date;
  cycle: { currentWeek: number };
  sets: SetLogData[];
};

export function processWorkoutLogsToChartData(
  workoutLogs: WorkoutLogDataInternal[]
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
    workoutLog: WorkoutLogDataInternal;
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

export type TimelineDayStatus = 'completed' | 'current' | 'upcoming';

export type TimelineDay = {
  week: number;
  day: number;
  programWorkoutId: string;
  workoutLogId: string | null;
  status: TimelineDayStatus;
  label: string;
  totalSets: number;
  totalVolume: number;
};

export type TimelineWeek = {
  weekNumber: number;
  days: TimelineDay[];
};

export type ProgramData = {
  id: string;
  name: string;
  totalWeeks: number;
  daysPerWeek: number;
};

export type TimelineData = {
  program: ProgramData;
  weeks: TimelineWeek[];
  completionPercentage: number;
  totalWorkouts: number;
  completedWorkouts: number;
};

export type ProgramWorkoutData = {
  id: string;
  weekNumber: number;
  dayNumber: number;
  label: string;
};

export type WorkoutLogSummary = {
  id: string;
  programWorkoutId: string;
  completedAt: Date | null;
  startedAt: Date;
  durationSeconds: number | null;
  sessionRpe: number | null;
  totalSets: number;
  totalVolume: number;
};

export type WorkoutLogSetData = {
  id: string;
  exerciseId: string;
  exercise: { name: string };
  setNumber: number;
  setType: string;
  actualWeight: number | null;
  actualReps: number | null;
  rpe: number | null;
};

export type WorkoutLogData = {
  id: string;
  programWorkoutId: string;
  completedAt: Date | null;
  startedAt: Date;
  durationSeconds: number | null;
  sessionRpe: number | null;
  totalSets: number;
  totalVolume: number;
  sets: WorkoutLogSetData[];
};

export type VolumeChartData = {
  week: number;
  muscleGroups: Record<string, number>;
  totalVolume: number;
  weekOverWeek: number | null;
};

type SetLogWithMuscleGroup = {
  id: string;
  exerciseId: string;
  exercise: { name: string; muscleGroup: string | null };
  actualWeight: number | null;
  actualReps: number | null;
  setNumber: number;
  setType: string;
};

type WorkoutLogWithSets = {
  id: string;
  completedAt: Date | null;
  cycleId: string;
  programWorkoutId: string;
  startedAt: Date;
  cycle: { currentWeek: number };
  sets: SetLogWithMuscleGroup[];
};

export function processWorkoutLogsToVolumeData(
  workoutLogs: WorkoutLogWithSets[]
): VolumeChartData[] {
  if (workoutLogs.length === 0) {
    return [];
  }

  const weekMap = new Map<number, Record<string, number>>();

  for (const workoutLog of workoutLogs) {
    const week = workoutLog.cycle.currentWeek;
    let muscleGroups = weekMap.get(week);

    if (!muscleGroups) {
      muscleGroups = {};
      weekMap.set(week, muscleGroups);
    }

    for (const set of workoutLog.sets) {
      const weight = set.actualWeight;
      const reps = set.actualReps;
      const muscleGroup = set.exercise.muscleGroup ?? 'Uncategorized';

      if (weight === null || reps === null) {
        continue;
      }

      const tonnage = weight * reps;
      muscleGroups[muscleGroup] = (muscleGroups[muscleGroup] ?? 0) + tonnage;
    }
  }

  const sortedWeeks = Array.from(weekMap.keys()).sort((a, b) => a - b);

  const result: VolumeChartData[] = [];
  let previousTotalVolume: number | null = null;

  for (const week of sortedWeeks) {
    const muscleGroups = weekMap.get(week)!;
    const totalVolume = Object.values(muscleGroups).reduce((sum, v) => sum + v, 0);

    let weekOverWeek: number | null = null;
    if (previousTotalVolume !== null) {
      weekOverWeek = (totalVolume - previousTotalVolume) / previousTotalVolume;
    }

    result.push({
      week,
      muscleGroups,
      totalVolume,
      weekOverWeek,
    });

    previousTotalVolume = totalVolume;
  }

  return result;
}

export function generateProgramTimelineData(
  program: ProgramData,
  currentWeek: number,
  programWorkouts: ProgramWorkoutData[],
  workoutLogs: WorkoutLogSummary[]
): TimelineData {
  const { totalWeeks, daysPerWeek } = program;
  const totalWorkouts = totalWeeks * daysPerWeek;

  const workoutLogMap = new Map<string, WorkoutLogSummary>();
  for (const log of workoutLogs) {
    if (log.completedAt) {
      workoutLogMap.set(log.programWorkoutId, log);
    }
  }

  const completedWorkouts = workoutLogMap.size;
  const completionPercentage = totalWorkouts > 0
    ? Math.round((completedWorkouts / totalWorkouts) * 100)
    : 0;

  const programWorkoutMap = new Map<string, ProgramWorkoutData>();
  for (const pw of programWorkouts) {
    const key = `${pw.weekNumber}-${pw.dayNumber}`;
    programWorkoutMap.set(key, pw);
  }

  let foundCurrent = false;
  const weeks: TimelineWeek[] = [];

  for (let weekNum = 1; weekNum <= totalWeeks; weekNum++) {
    const days: TimelineDay[] = [];

    for (let dayNum = 1; dayNum <= daysPerWeek; dayNum++) {
      const key = `${weekNum}-${dayNum}`;
      const programWorkout = programWorkoutMap.get(key);
      const programWorkoutId = programWorkout?.id ?? key;
      const label = programWorkout?.label ?? `Day ${dayNum}`;

      let status: TimelineDayStatus;
      let workoutLogId: string | null = null;
      let totalSets = 0;
      let totalVolume = 0;

      const log = workoutLogMap.get(programWorkoutId);
      if (log) {
        status = 'completed';
        workoutLogId = log.id;
        totalSets = log.totalSets;
        totalVolume = log.totalVolume;
      } else if (!foundCurrent && weekNum === currentWeek) {
        status = 'current';
        foundCurrent = true;
      } else {
        status = 'upcoming';
      }

      days.push({
        week: weekNum,
        day: dayNum,
        programWorkoutId,
        workoutLogId,
        status,
        label,
        totalSets,
        totalVolume,
      });
    }

    weeks.push({ weekNumber: weekNum, days });
  }

  return {
    program,
    weeks,
    completionPercentage,
    totalWorkouts,
    completedWorkouts,
  };
}
