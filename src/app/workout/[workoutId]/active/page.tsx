import { getOrCreateWorkoutLog } from '@/actions/workout';
import { getUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { groupExercises, generateCircuitSets } from '@/lib/circuit-grouper';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity, Target } from 'lucide-react';

interface ActiveWorkoutPageProps {
  params: Promise<{
    workoutId: string;
  }>;
}

export default async function ActiveWorkoutPage({ params }: ActiveWorkoutPageProps) {
  const { workoutId } = await params;
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }

  // Fetch workout with exercises
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
    redirect('/');
  }

  // Fetch active cycle
  const activeCycle = await prisma.cycle.findFirst({
    where: { userId: user.id, status: 'active', programId: workout.programWeek.programId },
    include: {
      user: true, // to get unitPref
    },
  });

  if (!activeCycle) {
    redirect('/');
  }

  const { data: workoutLog, error } = await getOrCreateWorkoutLog(workoutId);

  if (error || !workoutLog) {
    console.error('Failed to init workout log:', error);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-xl font-bold text-red-500 mb-2">Error</h1>
        <p className="text-gray-600 mb-4">{error || 'Could not initialize workout session.'}</p>
        <a href={`/workout/${workoutId}/preview`} className="text-blue-500 underline">
          Go back to preview
        </a>
      </div>
    );
  }

  const unitPref = activeCycle.user.unitPref as 'kg' | 'lb';
  const rms = {
    squat1rm: activeCycle.squat1rm,
    bench1rm: activeCycle.bench1rm,
    deadlift1rm: activeCycle.deadlift1rm,
    unit: unitPref,
  };

  const exerciseGroups = groupExercises(workout.exercises);

  return (
    <div className="container max-w-md mx-auto p-4 pb-24">
      <h1 className="text-2xl font-bold mb-4">Active Workout</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <p className="text-sm text-gray-500">Session ID: {workoutLog.id}</p>
        <p className="text-sm text-gray-500">
          Started at: {new Date(workoutLog.startedAt).toLocaleTimeString()}
        </p>
      </div>

      <div className="space-y-6">
        {exerciseGroups.map((group, groupIndex) => {
          if (!group.isCircuit) {
            const progEx = group.exercises[0];
            const sets = generateCircuitSets([progEx], rms);

            return (
              <Card key={`group-${groupIndex}`} className="overflow-hidden">
                <CardHeader className="bg-muted/30 pb-3">
                  <CardTitle className="text-base">{progEx.exercise.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {sets.map((set, setIndex) => (
                    <div key={`set-${setIndex}`} className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold uppercase text-muted-foreground">
                          {set.setType === 'warmup' ? 'Warmup' : `Set ${set.setNumber}`}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          {set.targetWeight && (
                            <span className="text-sm font-bold">{set.targetWeight} {unitPref}</span>
                          )}
                          {set.targetReps && (
                            <span className="text-sm text-muted-foreground">× {set.targetReps} reps</span>
                          )}
                          {set.targetRpe && (
                            <span className="text-sm text-muted-foreground">@ RPE {set.targetRpe}</span>
                          )}
                        </div>
                      </div>
                      <button className="h-8 px-4 bg-primary text-primary-foreground rounded-md text-sm font-medium">
                        Log
                      </button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          } else {
            // Circuit
            const sets = generateCircuitSets(group.exercises, rms);

            return (
              <Card key={`group-${groupIndex}`} className="overflow-hidden border-2 border-primary/20">
                <CardHeader className="bg-primary/5 pb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    <CardTitle className="text-base">Circuit {group.circuitGroup}</CardTitle>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {group.exercises.map(ex => ex.exercise.name).join(' • ')}
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {sets.map((set, setIndex) => (
                    <div key={`set-${setIndex}`} className="flex flex-col p-3 border border-primary/10 bg-primary/5 rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-primary">{set.exerciseName}</span>
                        <span className="text-xs font-semibold uppercase text-muted-foreground">
                          {set.setType === 'warmup' ? 'Warmup' : `Set ${set.setNumber}`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {set.targetWeight && (
                            <span className="text-sm font-bold">{set.targetWeight} {unitPref}</span>
                          )}
                          {set.targetReps && (
                            <span className="text-sm text-muted-foreground">× {set.targetReps} reps</span>
                          )}
                          {set.targetRpe && (
                            <span className="text-sm text-muted-foreground">@ RPE {set.targetRpe}</span>
                          )}
                        </div>
                        <button className="h-8 px-4 bg-primary text-primary-foreground rounded-md text-sm font-medium">
                          Log
                        </button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          }
        })}
      </div>
    </div>
  );
}
