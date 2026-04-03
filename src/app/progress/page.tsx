import { getUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { processWorkoutLogsToChartData } from '@/lib/progress';
import { LiftChart } from '@/components/progress/lift-chart';

const LIFT_CONFIG = {
  squat: { name: 'Squat', color: '#3b82f6' },
  bench: { name: 'Bench Press', color: '#ef4444' },
  deadlift: { name: 'Deadlift', color: '#22c55e' },
} as const;

async function getProgressData(userId: string) {
  const activeCycle = await prisma.cycle.findFirst({
    where: { userId, status: 'active' },
    include: {
      program: true,
    },
  });

  if (!activeCycle) {
    return { cycle: null, chartData: [] };
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
            select: { name: true },
          },
        },
      },
    },
    orderBy: { completedAt: 'asc' },
  });

  const chartData = processWorkoutLogsToChartData(workoutLogs);

  return { cycle: activeCycle, chartData };
}

export default async function ProgressPage() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const { cycle, chartData } = await getProgressData(user.id);

  if (!cycle) {
    return (
      <div className="flex flex-col flex-1 pb-28 bg-zinc-50 dark:bg-black min-h-screen">
        <header className="px-4 py-6 bg-white dark:bg-zinc-950 shadow-sm">
          <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-bold tracking-tight">Progress</h1>
            <p className="text-muted-foreground">Track your strength gains</p>
          </div>
        </header>
        <main className="flex-1 p-4 max-w-md mx-auto w-full">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No active training cycle found.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Start a program to track your progress.
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
          <h1 className="text-2xl font-bold tracking-tight">Progress</h1>
          <p className="text-muted-foreground">
            {cycle.program.name} — Week {cycle.currentWeek}
          </p>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-md mx-auto w-full space-y-6">
        {chartData.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No completed workouts yet.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Complete workouts to see your strength progress.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-6">
              <LiftChart data={chartData} liftKey="squat" />
              <LiftChart data={chartData} liftKey="bench" />
              <LiftChart data={chartData} liftKey="deadlift" />
            </div>

            {chartData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p>
                    <span className="text-muted-foreground">Weeks tracked:</span>{' '}
                    <span className="font-medium">{chartData.length}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Current 1RMs:</span>
                  </p>
                  <ul className="ml-4 space-y-0.5 mt-1">
                    <li>
                      <span style={{ color: LIFT_CONFIG.squat.color }}>●</span> Squat:{' '}
                      {chartData[chartData.length - 1].squat?.toFixed(1) ?? '—'} kg
                    </li>
                    <li>
                      <span style={{ color: LIFT_CONFIG.bench.color }}>●</span> Bench:{' '}
                      {chartData[chartData.length - 1].bench?.toFixed(1) ?? '—'} kg
                    </li>
                    <li>
                      <span style={{ color: LIFT_CONFIG.deadlift.color }}>●</span> Deadlift:{' '}
                      {chartData[chartData.length - 1].deadlift?.toFixed(1) ?? '—'} kg
                    </li>
                  </ul>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}
