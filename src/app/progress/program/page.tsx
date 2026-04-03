import { getUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { generateProgramTimelineData, ProgramData } from '@/lib/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Calendar } from 'lucide-react';
import ProgramTimelineWrapper from './program-timeline-wrapper';

async function getProgramTimelineData(userId: string) {
  const activeCycle = await prisma.cycle.findFirst({
    where: { userId, status: 'active' },
    include: {
      program: true,
    },
  });

  if (!activeCycle) {
    return null;
  }

  const programWeeks = await prisma.programWeek.findMany({
    where: { programId: activeCycle.programId },
    include: {
      workouts: {
        orderBy: { dayNumber: 'asc' },
      },
    },
    orderBy: { weekNumber: 'asc' },
  });

  const workoutLogs = await prisma.workoutLog.findMany({
    where: { cycleId: activeCycle.id },
    include: {
      sets: {
        include: {
          exercise: {
            select: { name: true },
          },
        },
      },
    },
  });

  const workoutLogSummaries = workoutLogs.map((log) => ({
    id: log.id,
    programWorkoutId: log.programWorkoutId,
    completedAt: log.completedAt,
    startedAt: log.startedAt,
    durationSeconds: log.durationSeconds,
    sessionRpe: log.sessionRpe,
    totalSets: log.sets.length,
    totalVolume: log.sets.reduce((sum, set) => {
      if (set.actualWeight && set.actualReps) {
        return sum + set.actualWeight * set.actualReps;
      }
      return sum;
    }, 0),
  }));

  const programWorkouts = programWeeks.flatMap((week) =>
    week.workouts.map((w) => ({
      id: w.id,
      weekNumber: week.weekNumber,
      dayNumber: w.dayNumber,
      label: w.label,
    }))
  );

  const programData: ProgramData = {
    id: activeCycle.program.id,
    name: activeCycle.program.name,
    totalWeeks: activeCycle.program.totalWeeks,
    daysPerWeek: activeCycle.program.daysPerWeek,
  };

  const timelineData = generateProgramTimelineData(
    programData,
    activeCycle.currentWeek,
    programWorkouts,
    workoutLogSummaries
  );

  return {
    cycle: activeCycle,
    timelineData,
    workoutLogs,
  };
}

export default async function ProgramOverviewPage() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const data = await getProgramTimelineData(user.id);

  if (!data) {
    return (
      <div className="flex flex-col flex-1 pb-28 bg-zinc-50 dark:bg-black min-h-screen">
        <header className="px-4 py-6 bg-white dark:bg-zinc-950 shadow-sm">
          <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-bold tracking-tight">Program Overview</h1>
            <p className="text-muted-foreground">Track your training progress</p>
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

  const { cycle, timelineData, workoutLogs } = data;

  return (
    <div className="flex flex-col flex-1 pb-28 bg-zinc-50 dark:bg-black min-h-screen">
      <header className="px-4 py-6 bg-white dark:bg-zinc-950 shadow-sm">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold tracking-tight">Program Overview</h1>
          <p className="text-muted-foreground">{cycle.program.name}</p>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-md mx-auto w-full space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Completion Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold">{timelineData.completionPercentage}%</span>
              <span className="text-muted-foreground mb-1">
                ({timelineData.completedWorkouts}/{timelineData.totalWorkouts} workouts)
              </span>
            </div>
            <div className="mt-3 h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${timelineData.completionPercentage}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Training Timeline
          </h2>
          <ProgramTimelineWrapper
            weeks={timelineData.weeks}
            workoutLogs={workoutLogs.map((log) => {
              const totalVolume = log.sets.reduce((sum, set) => {
                if (set.actualWeight && set.actualReps) {
                  return sum + set.actualWeight * set.actualReps;
                }
                return sum;
              }, 0);
              return {
                id: log.id,
                programWorkoutId: log.programWorkoutId,
                completedAt: log.completedAt,
                startedAt: log.startedAt,
                durationSeconds: log.durationSeconds,
                sessionRpe: log.sessionRpe,
                totalSets: log.sets.length,
                totalVolume,
                sets: log.sets.map((set) => ({
                  id: set.id,
                  exerciseId: set.exerciseId,
                  exercise: { name: set.exercise.name },
                  setNumber: set.setNumber,
                  setType: set.setType,
                  actualWeight: set.actualWeight,
                  actualReps: set.actualReps,
                  rpe: set.rpe,
                })),
              };
            })}
          />
        </div>
      </main>
    </div>
  );
}