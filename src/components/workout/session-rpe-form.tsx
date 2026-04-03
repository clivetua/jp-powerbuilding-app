'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { saveWorkoutSummary } from '@/actions/workout';

export function SessionRpeForm({ workoutLogId }: { workoutLogId: string }) {
  const [rpe, setRpe] = useState<number>(7);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    setLoading(true);
    const result = await saveWorkoutSummary(workoutLogId, rpe);
    if (result.error) {
      alert(result.error);
      setLoading(false);
    } else {
      router.push('/');
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium">Session RPE (1-10)</label>
          <span className="text-lg font-bold">{rpe}</span>
        </div>
        <Slider
          value={[rpe]}
          onValueChange={(val) => {
            if (Array.isArray(val) || (typeof val === 'object' && val !== null && '0' in val)) {
              setRpe((val as any)[0]);
            } else if (typeof val === 'number') {
              setRpe(val);
            }
          }}
          max={10}
          min={1}
          step={1}
        />
        <p className="text-xs text-muted-foreground">
          How hard was this session overall? 1 = Effortless, 10 = Maximal effort.
        </p>
      </div>
      
      <Button 
        className="w-full" 
        size="lg" 
        onClick={handleSave} 
        disabled={loading}
      >
        {loading ? 'Saving...' : 'Save & Finish'}
      </Button>
    </div>
  );
}
