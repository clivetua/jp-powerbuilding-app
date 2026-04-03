import { getOrCreateWorkoutLog } from '@/actions/workout';
import { redirect } from 'next/navigation';

interface ActiveWorkoutPageProps {
  params: Promise<{
    workoutId: string;
  }>;
}

export default async function ActiveWorkoutPage({ params }: ActiveWorkoutPageProps) {
  const { workoutId } = await params;

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

  return (
    <div className="container max-w-md mx-auto p-4 pb-24">
      <h1 className="text-2xl font-bold mb-4">Active Workout</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <p className="text-sm text-gray-500">Session ID: {workoutLog.id}</p>
        <p className="text-sm text-gray-500">
          Started at: {new Date(workoutLog.startedAt).toLocaleTimeString()}
        </p>
      </div>

      <div className="space-y-4">
        <p>Workout in progress...</p>
        {/* TODO: Render exercises, sets, and active timer here */}
      </div>
    </div>
  );
}
