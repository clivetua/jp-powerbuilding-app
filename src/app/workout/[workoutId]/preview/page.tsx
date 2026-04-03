import { getUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { calculateTargetWeight, calculateWarmupPyramid } from '@/lib/calculations';
import { ArrowLeft, Play, Info, Activity, Target } from 'lucide-react';
import { notFound } from 'next/navigation';

export default async function WorkoutPreviewPage({
  params,
}: {
  params: Promise<{ workoutId: string }>;
}) {
  const { workoutId } = await params;
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }

  // Fetch the workout with its exercises
  const workout = await prisma.programWorkout.findUnique({
    where: { id: workoutId },
    include: {
      programWeek: {
        include: {
          program: true,
        },
      },
      exercises: {
        include: {
          exercise: true,
        },
        orderBy: {
          orderIndex: 'asc',
        },
      },
    },
  });

  if (!workout) {
    notFound();
  }

  // Fetch active cycle to get 1RMs and unit preference
  const activeCycle = await prisma.cycle.findFirst({
    where: { userId: user.id, status: 'active', programId: workout.programWeek.programId },
    include: {
      user: true, // to get unitPref
    },
  });

  if (!activeCycle) {
    redirect('/');
  }

  const unitPref = activeCycle.user.unitPref as 'kg' | 'lb';

  // Helper to determine which 1RM to use based on exercise name
  const get1RM = (exerciseName: string) => {
    const name = exerciseName.toLowerCase();
    if (name.includes('squat')) return activeCycle.squat1rm;
    if (name.includes('bench')) return activeCycle.bench1rm;
    if (name.includes('deadlift')) return activeCycle.deadlift1rm;
    return null;
  };

  return (
    <div className="flex flex-col flex-1 bg-zinc-50 dark:bg-black min-h-screen pb-28">
      {/* Header */}
      <header className="px-4 py-4 bg-white dark:bg-zinc-950 shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="sr-only">Back</span>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Day {workout.dayNumber}: {workout.label}</h1>
            <p className="text-sm text-muted-foreground">
              {workout.programWeek.program.name} - Week {workout.programWeek.weekNumber}
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-md mx-auto w-full space-y-6">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5" /> Exercises
          </h2>
          <p className="text-sm text-muted-foreground">
            Review your workout and warm-up sets before you begin.
          </p>
        </div>

        <div className="space-y-4">
          {workout.exercises.map((progEx) => {
            const exerciseName = progEx.exercise.name;
            const oneRm = get1RM(exerciseName);
            
            // Calculate target weight if percent1rm is provided and we have the 1RM
            let targetWeight: number | null = null;
            if (progEx.percent1rm && oneRm) {
              targetWeight = calculateTargetWeight(oneRm, progEx.percent1rm, unitPref);
            }

            // Generate warm-up pyramid for primary lifts (using percent1rm as a proxy for primary)
            // or if it specifically has warmupSets > 0 and we can calculate a weight.
            const isPrimary = progEx.exercise.category === 'primary';
            const needsWarmup = progEx.warmupSets > 0 || isPrimary;
            let warmupPyramid: Array<{ set: number, weight: number, reps: number, label: string }> = [];
            
            if (needsWarmup && targetWeight) {
               warmupPyramid = calculateWarmupPyramid(targetWeight, unitPref);
            }

            return (
              <Card key={progEx.id} className="overflow-hidden">
                <CardHeader className="bg-muted/30 pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <CardTitle className="text-base">{exerciseName}</CardTitle>
                      {progEx.exercise.category && (
                        <CardDescription className="uppercase text-[10px] tracking-wider mt-1 font-semibold">
                          {progEx.exercise.category}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {/* Sets, Reps, Weight/RPE */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium uppercase">Protocol</p>
                      <p className="font-semibold text-sm">
                        {progEx.workingSets} sets × {progEx.targetReps}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium uppercase">Target</p>
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-primary">
                        <Target className="w-4 h-4" />
                        {targetWeight ? (
                          <span>{targetWeight} {unitPref}</span>
                        ) : progEx.targetRpe ? (
                          <span>RPE {progEx.targetRpe}</span>
                        ) : (
                          <span>-</span>
                        )}
                        {progEx.percent1rm && (
                          <span className="text-xs text-muted-foreground font-normal ml-1">
                            ({progEx.percent1rm}%)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notes / Cues */}
                  {progEx.notes && (
                    <div className="bg-primary/5 rounded-md p-3 flex gap-2 items-start border border-primary/10">
                      <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <p className="text-sm text-foreground/90 leading-snug">{progEx.notes}</p>
                    </div>
                  )}

                  {/* Warm-up Pyramid */}
                  {warmupPyramid.length > 0 && (
                    <div className="pt-2">
                      <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1">
                        Warm-up Pyramid
                      </h4>
                      <div className="space-y-1.5">
                        {warmupPyramid.map((step, idx) => (
                          <div key={idx} className="flex justify-between text-sm py-1.5 px-3 rounded bg-muted/40 border border-border/50">
                            <span className="text-muted-foreground">{step.label}</span>
                            <span className="font-medium">
                              {step.weight} {unitPref} × {step.reps}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>

      {/* Start Session Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] z-20">
        <div className="max-w-md mx-auto">
          <Link 
            href={`/workout/${workout.id}/active`}
            className={buttonVariants({ size: "lg", className: "w-full font-bold text-base h-14 rounded-xl" })}
          >
            <Play className="w-5 h-5 mr-2 fill-current" />
            Let&apos;s Go!
          </Link>
        </div>
      </div>
    </div>
  );
}
