import { getUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { SessionRpeForm } from '@/components/workout/session-rpe-form';
import { Clock, Dumbbell, Zap } from 'lucide-react';

interface WorkoutSummaryPageProps {
  params: Promise<{
    workoutId: string;
  }>;
}

export default async function WorkoutSummaryPage({ params }: WorkoutSummaryPageProps) {
  const { workoutId } = await params;
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }

  // Fetch the latest workout log for this programWorkoutId
  const workoutLog = await prisma.workoutLog.findFirst({
    where: {
      userId: user.id,
      programWorkoutId: workoutId,
      completedAt: { not: null },
    },
    orderBy: {
      completedAt: 'desc',
    },
    include: {
      sets: true,
      programWorkout: {
        include: {
          programWeek: true,
        },
      },
    },
  });

  if (!workoutLog) {
    redirect('/');
  }

  // Calculate stats
  const completedSets = workoutLog.sets.length;
  const uniqueExercises = new Set(workoutLog.sets.map(s => s.exerciseId)).size;
  const totalVolume = workoutLog.sets.reduce((acc, set) => {
    return acc + ((set.actualWeight || 0) * (set.actualReps || 0));
  }, 0);
  
  const durationMinutes = workoutLog.durationSeconds 
    ? Math.round(workoutLog.durationSeconds / 60) 
    : 0;

  return (
    <div className="container max-w-md mx-auto p-4 pb-24">
      <h1 className="text-3xl font-bold mb-2">Workout Complete!</h1>
      <p className="text-muted-foreground mb-6">
        Week {workoutLog.programWorkout.programWeek.weekNumber} - Day {workoutLog.programWorkout.dayNumber}
      </p>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
            <Clock className="w-8 h-8 text-blue-500 mb-2" />
            <div className="text-2xl font-bold">{durationMinutes}</div>
            <div className="text-xs text-muted-foreground uppercase">Minutes</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
            <Dumbbell className="w-8 h-8 text-green-500 mb-2" />
            <div className="text-2xl font-bold">{uniqueExercises}</div>
            <div className="text-xs text-muted-foreground uppercase">Exercises</div>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
            <Zap className="w-8 h-8 text-yellow-500 mb-2" />
            <div className="text-2xl font-bold">{totalVolume.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground uppercase">Total Volume</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Session Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <SessionRpeForm workoutLogId={workoutLog.id} />
        </CardContent>
      </Card>
    </div>
  );
}
