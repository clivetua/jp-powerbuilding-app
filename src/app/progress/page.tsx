import { getUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { processWorkoutLogsToChartData } from '@/lib/progress';
import { TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';

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

function LiftChart({
  data,
  liftKey,
}: {
  data: ReturnType<typeof processWorkoutLogsToChartData>;
  liftKey: 'squat' | 'bench' | 'deadlift';
}) {
  const config = LIFT_CONFIG[liftKey];
  const prPoints: { x: number; y: number }[] = [];

  const chartDataWithIndex = data.map((d, i) => ({
    ...d,
    index: i + 1,
    [`${liftKey}PR`]: d[`${liftKey}PR` as 'squatPR' | 'benchPR' | 'deadliftPR'],
  }));

  chartDataWithIndex.forEach((d) => {
    if (d[`${liftKey}PR` as 'squatPR' | 'benchPR' | 'deadliftPR']) {
      const prValue = d[liftKey];
      if (prValue !== null) {
        prPoints.push({ x: d.index, y: prValue });
      }
    }
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-4 h-4" style={{ color: config.color }} />
          {config.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartDataWithIndex}
              margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="index"
                tickFormatter={(v) => `W${v}`}
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                className="text-xs"
                tick={{ fontSize: 12 }}
                domain={['dataMin - 10', 'dataMax + 10']}
              />
              <Tooltip
                formatter={(value) => [`${Number(value).toFixed(1)} kg`, 'Est. 1RM']}
                labelFormatter={(label) => `Week ${label}`}
              />
              <Line
                type="monotone"
                dataKey={liftKey}
                stroke={config.color}
                strokeWidth={2}
                dot={{ fill: config.color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 2 }}
                connectNulls
              />
              {prPoints.map((point, i) => (
                <ReferenceDot
                  key={i}
                  x={point.x}
                  y={point.y}
                  r={6}
                  fill={config.color}
                  stroke="#fff"
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
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
