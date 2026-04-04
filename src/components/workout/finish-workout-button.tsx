'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { finishWorkout } from '@/actions/workout';

export function FinishWorkoutButton({ workoutLogId, workoutId }: { workoutLogId: string; workoutId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleFinish = async () => {
    setLoading(true);
    const result = await finishWorkout(workoutLogId);
    if (result.error) {
      alert(result.error);
      setLoading(false);
    } else {
      router.push(`/workout/${workoutId}/summary`);
    }
  };

  return (
    <Button 
      className="w-full mt-8" 
      size="lg" 
      onClick={handleFinish} 
      disabled={loading}
    >
      {loading ? 'Finishing...' : 'Finish Workout'}
    </Button>
  );
}
