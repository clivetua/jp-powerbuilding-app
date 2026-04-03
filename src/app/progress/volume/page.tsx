import { getUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { processWorkoutLogsToVolumeData } from '@/lib/progress';
import { VolumeChart, VolumeSummary, MuscleGroupBreakdown } from '@/components/progress/volume-chart';

async function getVolumeData(userId: string) {
  const activeCycle = await prisma.cycle.findFirst({
    where: { userId, status: 'active' },
    include: {
      program: true,
    },
  });

  if (!activeCycle) {
    return { cycle: null, volumeData: [] };
  }

  const workoutLogs = await prisma.workoutLog.findMany({
    where: {
      cycleId: activeCycle.id,
      completedAt: { not: null },
    },
    include: {
      cycle: {
        select: { currentWeek: true },
      },
      sets: {
        include: {
          exercise: {
            select: { name: true, muscleGroup: true },
          },
        },
      },
    },
    orderBy: { completedAt: 'asc' },
  });

  const volumeData = processWorkoutLogsToVolumeData(workoutLogs);

  return { cycle: activeCycle, volumeData };
}

export default async function VolumeTrackingPage() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const { cycle, volumeData } = await getVolumeData(user.id);

  if (!cycle) {
    return (
      <div className="flex flex-col flex-1 pb-28 bg-zinc-50 dark:bg-black min-h-screen">
        <header className="px-4 py-6 bg-white dark:bg-zinc-950 shadow-sm">
          <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-bold tracking-tight">Volume Tracking</h1>
            <p className="text-muted-foreground">Weekly tonnage by muscle group</p>
          </div>
        </header>
        <main className="flex-1 p-4 max-w-md mx-auto w-full">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No active training cycle found.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Start a program to track your volume.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 pb-28 bg-zinc-50 dark:bg-black min-h-screen">
      <header className="px-4 py-6 bg-white dark:bg-zinc-950 shadow-sm">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold tracking-tight">Volume Tracking</h1>
          <p className="text-muted-foreground">
            {cycle.program.name} — Week {cycle.currentWeek}
          </p>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-md mx-auto w-full space-y-6">
        {volumeData.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No completed workouts yet.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Complete workouts to see your volume tracking.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <VolumeSummary data={volumeData} />
            <VolumeChart data={volumeData} />
            <MuscleGroupBreakdown data={volumeData} />
          </>
        )}
      </main>
    </div>
  );
}
