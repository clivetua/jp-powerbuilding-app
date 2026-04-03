export function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds <= 0) {
    return '0m';
  }

  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}

export type WorkoutHistoryItem = {
  id: string;
  completedAt: Date | null;
  startedAt: Date;
  durationSeconds: number | null;
  totalSets: number;
  totalVolume: number;
  programWorkout: {
    label: string;
    dayNumber: number;
    programWeek: {
      weekNumber: number;
      program: {
        name: string;
      };
    };
  };
  sets: Array<{
    id: string;
    exerciseId: string;
    exercise: {
      name: string;
    };
    setNumber: number;
    setType: string;
    actualWeight: number | null;
    actualReps: number | null;
    rpe: number | null;
  }>;
};

export function calculateWorkoutTotalVolume(sets: WorkoutHistoryItem['sets']): number {
  return sets.reduce((total, set) => {
    if (set.actualWeight !== null && set.actualReps !== null) {
      return total + set.actualWeight * set.actualReps;
    }
    return total;
  }, 0);
}
