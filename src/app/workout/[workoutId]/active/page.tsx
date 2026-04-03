import { getOrCreateWorkoutLog } from '@/actions/workout';
import { getUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { groupExercises, generateCircuitSets } from '@/lib/circuit-grouper';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity, Target } from 'lucide-react';
import { SetLogger } from '@/components/workout/set-logger';

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

  const existingSets = await prisma.setLog.findMany({ where: { workoutLogId: workoutLog.id } });

  const hydrateSets = (generatedSets: ReturnType<typeof generateCircuitSets>) => {
    return generatedSets.map(set => {
      const existingSet = existingSets.find(s => s.exerciseId === set.exerciseId && s.setNumber === set.setNumber);
      if (existingSet) {
        return {
          ...set,
          id: existingSet.id,
          actualWeight: existingSet.actualWeight,
          actualReps: existingSet.actualReps,
          rpe: existingSet.rpe,
          completedAt: existingSet.completedAt,
        };
      }
      return set;
    });
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
            let sets = generateCircuitSets([progEx], rms);
            sets = hydrateSets(sets);

            return (
              <Card key={`group-${groupIndex}`} className="overflow-hidden">
                <CardHeader className="bg-muted/30 pb-3">
                  <CardTitle className="text-base">{progEx.exercise.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <SetLogger workoutLogId={workoutLog.id} sets={sets} />
                </CardContent>
              </Card>
            );
          } else {
            // Circuit
            let sets = generateCircuitSets(group.exercises, rms);
            sets = hydrateSets(sets);

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
                  <SetLogger workoutLogId={workoutLog.id} sets={sets} />
                </CardContent>
              </Card>
            );
          }
        })}
      </div>
    </div>
  );
}
