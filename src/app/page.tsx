import { getUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { CheckCircle, Circle, Play, Activity, CalendarDays } from 'lucide-react';
import { LocalTime } from '@/components/ui/local-time';
import { ProgramWorkout } from '@/generated/prisma/client';

export default async function Home() {
  const user = await getUser();
  
  if (!user) {
    redirect('/login');
  }
  
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
  });
  
  if (!profile) {
    redirect('/onboarding');
  }

  // 1 & 4. Fetch active cycle and recent history concurrently
  const [activeCycle, recentLogs] = await Promise.all([
    prisma.cycle.findFirst({
      where: { userId: user.id, status: 'active' },
      include: {
        program: true,
      }
    }),
    prisma.workoutLog.findMany({
      where: { userId: user.id, completedAt: { not: null } },
      orderBy: { completedAt: 'desc' },
      take: 3,
      include: {
        programWorkout: {
          include: {
            programWeek: {
              include: { program: true }
            }
          }
        }
      }
    })
  ]);

  let programWeek = null;
  let weekWorkouts: ProgramWorkout[] = [];
  let nextWorkout: ProgramWorkout | null = null;
  let completedWorkoutIds: string[] = [];

  if (activeCycle) {
    // 2. Fetch current week's workouts
    programWeek = await prisma.programWeek.findFirst({
      where: {
        programId: activeCycle.programId,
        weekNumber: activeCycle.currentWeek,
      },
      include: {
        workouts: {
          orderBy: { dayNumber: 'asc' }
        }
      }
    });

    if (programWeek) {
      weekWorkouts = programWeek.workouts;
      
      // 3. Find completed workouts this cycle to see what's done
      const cycleLogs = await prisma.workoutLog.findMany({
        where: { cycleId: activeCycle.id, completedAt: { not: null } },
        select: { programWorkoutId: true }
      });
      
      completedWorkoutIds = cycleLogs.map(log => log.programWorkoutId);
        
      nextWorkout = weekWorkouts.find(w => !completedWorkoutIds.includes(w.id)) || null;
    }
  }

  return (
    <div className="flex flex-col flex-1 pb-28 bg-zinc-50 dark:bg-black min-h-screen">
      {/* Header */}
      <header className="px-4 py-6 bg-white dark:bg-zinc-950 shadow-sm">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold tracking-tight">Home</h1>
          <p className="text-muted-foreground">Welcome back, {profile.displayName || 'Athlete'}</p>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-md mx-auto w-full space-y-6">
        {/* Active Cycle / Next Workout */}
        {activeCycle ? (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5" /> Current Program
            </h2>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>{activeCycle.program.name}</CardDescription>
                <CardTitle className="text-xl">
                  {nextWorkout ? (
                    <>Week {activeCycle.currentWeek} / Day {nextWorkout.dayNumber} — {nextWorkout.label}</>
                  ) : (
                    <>Week {activeCycle.currentWeek} Complete!</>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Upcoming workouts list for this week */}
                <div className="space-y-3 mt-2">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">This Week&apos;s Workouts</h3>
                  {weekWorkouts.map((workout) => {
                    const isCompleted = completedWorkoutIds.includes(workout.id);
                    const isNext = nextWorkout?.id === workout.id;
                    return (
                      <div key={workout.id} className={`flex items-center gap-3 p-3 rounded-lg border ${isNext ? 'bg-primary/5 border-primary/20' : 'bg-card'}`}>
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                        ) : isNext ? (
                          <Circle className="w-5 h-5 text-primary shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                            Day {workout.dayNumber}: {workout.label}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </section>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Active Program</CardTitle>
              <CardDescription>Start a new training cycle to see your workouts here.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/programs" className={buttonVariants({ className: "w-full" })}>Browse Programs</Link>
            </CardContent>
          </Card>
        )}

        {/* Recent History */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CalendarDays className="w-5 h-5" /> Recent Activity
          </h2>
          {recentLogs.length > 0 ? (
            <div className="space-y-3">
              {recentLogs.map(log => {
                const workoutName = log.programWorkout.label;
                const programName = log.programWorkout.programWeek.program.name;
                const weekNum = log.programWorkout.programWeek.weekNumber;
                const dayNum = log.programWorkout.dayNumber;

                return (
                  <Card key={log.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{workoutName}</p>
                        <p className="text-xs text-muted-foreground">{programName} - W{weekNum}D{dayNum}</p>
                      </div>
                      <div className="text-sm font-medium text-muted-foreground">
                        {log.completedAt && <LocalTime date={log.completedAt} />}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6 border rounded-lg border-dashed">
              No recent workouts yet.
            </p>
          )}
        </section>
      </main>

      {/* Start Workout Fixed Bottom Button */}
      {activeCycle && nextWorkout && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t md:bottom-auto md:top-0 md:border-t-0 md:border-b md:sticky md:z-10 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)]">
          <div className="max-w-md mx-auto">
            <Link 
              href={`/workout/${nextWorkout.id}/preview`}
              className={buttonVariants({ size: "lg", className: "w-full font-semibold text-base h-14" })}
            >
              <Play className="w-5 h-5 mr-2 fill-current" />
              Start Day {nextWorkout.dayNumber} Workout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
