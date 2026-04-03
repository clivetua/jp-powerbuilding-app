import { ProgramExercise, Exercise } from '@/generated/prisma/client';
import { calculateTargetWeight } from './calculations';

export type ProgramExerciseWithDetails = ProgramExercise & {
  exercise: Exercise;
};

export interface ExerciseGroup {
  isCircuit: boolean;
  circuitGroup?: string;
  exercises: ProgramExerciseWithDetails[];
}

export interface ExpectedSet {
  programExerciseId: string;
  exerciseName: string;
  setNumber: number;
  setType: 'warmup' | 'working';
  targetWeight?: number;
  targetReps?: number;
  targetRpe?: number;
  restSeconds?: number;
}

export interface OneRepMaxes {
  squat1rm?: number | null;
  bench1rm?: number | null;
  deadlift1rm?: number | null;
  unit: 'kg' | 'lb';
}

export function groupExercises(exercises: ProgramExerciseWithDetails[]): ExerciseGroup[] {
  const groups: ExerciseGroup[] = [];
  
  for (const ex of exercises) {
    if (!ex.circuitGroup) {
      groups.push({
        isCircuit: false,
        exercises: [ex]
      });
      continue;
    }

    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.isCircuit && lastGroup.circuitGroup === ex.circuitGroup) {
      lastGroup.exercises.push(ex);
    } else {
      groups.push({
        isCircuit: true,
        circuitGroup: ex.circuitGroup,
        exercises: [ex]
      });
    }
  }

  return groups;
}

export function generateCircuitSets(
  exercisesInCircuit: ProgramExerciseWithDetails[],
  rms: OneRepMaxes
): ExpectedSet[] {
  const allExpectedSets: ExpectedSet[] = [];

  // Determine max total sets
  let maxSets = 0;
  const setsByExercise = exercisesInCircuit.map(ex => {
    const totalSets = ex.warmupSets + ex.workingSets;
    if (totalSets > maxSets) maxSets = totalSets;

    const sets: ExpectedSet[] = [];
    
    // Parse target reps safely (might be "8-10" or "10")
    let parsedReps: number | undefined;
    if (ex.targetReps) {
      const match = ex.targetReps.match(/(\d+)/);
      if (match) parsedReps = parseInt(match[1], 10);
    }

    // Calculate weight if percentage is given
    let calculatedWeight: number | undefined;
    if (ex.percent1rm) {
      let baseRm = 0;
      if (ex.exercise.name.toLowerCase().includes('squat')) baseRm = rms.squat1rm || 0;
      else if (ex.exercise.name.toLowerCase().includes('bench')) baseRm = rms.bench1rm || 0;
      else if (ex.exercise.name.toLowerCase().includes('deadlift')) baseRm = rms.deadlift1rm || 0;
      
      if (baseRm > 0) {
        calculatedWeight = calculateTargetWeight(baseRm, ex.percent1rm, rms.unit);
      }
    }

    for (let i = 1; i <= totalSets; i++) {
      const isWarmup = i <= ex.warmupSets;
      sets.push({
        programExerciseId: ex.id,
        exerciseName: ex.exercise.name,
        setNumber: i,
        setType: isWarmup ? 'warmup' : 'working',
        targetWeight: isWarmup ? undefined : calculatedWeight,
        targetReps: parsedReps,
        targetRpe: ex.targetRpe ?? undefined,
        restSeconds: ex.restSeconds ?? undefined,
      });
    }
    return sets;
  });

  // Interleave
  for (let i = 0; i < maxSets; i++) {
    for (const exSets of setsByExercise) {
      if (i < exSets.length) {
        allExpectedSets.push(exSets[i]);
      }
    }
  }

  return allExpectedSets;
}
