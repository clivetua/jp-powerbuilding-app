import { getUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays } from 'lucide-react';
import { WorkoutHistoryCard } from '@/components/history/workout-history-card';
import { WorkoutHistoryItem, calculateWorkoutTotalVolume } from '@/lib/history';

async function getWorkoutHistory(userId: string): Promise<WorkoutHistoryItem[]> {
  const workoutLogs = await prisma.workoutLog.findMany({
    where: {
      userId,
      completedAt: { not: null },
    },
    include: {
      programWorkout: {
        include: {
          programWeek: {
            include: {
              program: {
                select: { name: true },
              },
            },
          },
        },
      },
      sets: {
        include: {
          exercise: {
            select: { name: true },
          },
        },
        orderBy: [
          { exercise: { name: 'asc' } },
          { setNumber: 'asc' },
        ],
      },
    },
    orderBy: { completedAt: 'desc' },
  });

  return workoutLogs.map((log) => ({
    id: log.id,
    completedAt: log.completedAt,
    startedAt: log.startedAt,
    durationSeconds: log.durationSeconds,
    totalSets: log.sets.length,
    totalVolume: calculateWorkoutTotalVolume(log.sets as WorkoutHistoryItem['sets']),
    programWorkout: {
      label: log.programWorkout.label,
      dayNumber: log.programWorkout.dayNumber,
      programWeek: {
        weekNumber: log.programWorkout.programWeek.weekNumber,
        program: {
          name: log.programWorkout.programWeek.program.name,
        },
      },
    },
    sets: log.sets.map((set) => ({
      id: set.id,
      exerciseId: set.exerciseId,
      exercise: {
        name: set.exercise.name,
      },
      setNumber: set.setNumber,
      setType: set.setType,
      actualWeight: set.actualWeight,
      actualReps: set.actualReps,
      rpe: set.rpe,
    })),
  }));
}

export default async function HistoryPage() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const workoutHistory = await getWorkoutHistory(user.id);

  return (
    <div className="flex flex-col flex-1 pb-28 bg-zinc-50 dark:bg-black min-h-screen">
      <header className="px-4 py-6 bg-white dark:bg-zinc-950 shadow-sm">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold tracking-tight">Workout History</h1>
          <p className="text-muted-foreground">All your completed workouts</p>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-md mx-auto w-full space-y-4">
        {workoutHistory.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No completed workouts yet.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Complete your first workout to see it here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {workoutHistory.map((workout) => (
              <WorkoutHistoryCard key={workout.id} workout={workout} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
