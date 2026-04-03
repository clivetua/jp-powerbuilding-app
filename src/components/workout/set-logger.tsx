'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { saveSetLog, SaveSetLogInput } from '@/actions/set-logs';
import { Check } from 'lucide-react';

export type ExpectedSet = {
  id?: string;
  setNumber: number;
  setType: string;
  targetWeight?: number | null;
  targetReps?: number | null;
  actualWeight?: number | null;
  actualReps?: number | null;
  rpe?: number | null;
  completedAt?: Date | null;
};

type SetLoggerProps = {
  workoutLogId: string;
  exerciseId: string;
  sets: ExpectedSet[];
};

export function SetLogger({ workoutLogId, exerciseId, sets }: SetLoggerProps) {
  const queryClient = useQueryClient();
  const queryKey = ['workout-sets', workoutLogId, exerciseId];

  return (
    <div className="space-y-4">
      {sets.map((set) => (
        <SetRow
          key={set.setNumber}
          workoutLogId={workoutLogId}
          exerciseId={exerciseId}
          set={set}
          queryKey={queryKey}
          queryClient={queryClient}
        />
      ))}
    </div>
  );
}

type SetRowProps = {
  workoutLogId: string;
  exerciseId: string;
  set: ExpectedSet;
  queryKey: any[];
  queryClient: QueryClient;
};

function SetRow({ workoutLogId, exerciseId, set, queryKey, queryClient }: SetRowProps) {
  const [weight, setWeight] = useState(set.actualWeight?.toString() ?? set.targetWeight?.toString() ?? '');
  const [reps, setReps] = useState(set.actualReps?.toString() ?? set.targetReps?.toString() ?? '');
  const [rpe, setRpe] = useState(set.rpe?.toString() ?? '');

  const isCompleted = !!set.completedAt;

  const mutation = useMutation({
    mutationFn: (data: SaveSetLogInput) => saveSetLog(data),
    onMutate: async (newSetData) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousSets = queryClient.getQueryData<ExpectedSet[]>(queryKey);

      // Optimistically update to the new value
      if (previousSets) {
        queryClient.setQueryData<ExpectedSet[]>(queryKey, (old) => {
          if (!old) return old;
          return old.map((s) =>
            s.setNumber === newSetData.setNumber
              ? {
                  ...s,
                  ...newSetData,
                  completedAt: new Date(),
                }
              : s
          );
        });
      }

      // Return a context object with the snapshotted value
      return { previousSets };
    },
    onError: (err, newSetData, context: any) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousSets) {
        queryClient.setQueryData(queryKey, context.previousSets);
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure server sync
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const handleDone = () => {
    mutation.mutate({
      id: set.id,
      workoutLogId,
      exerciseId,
      setNumber: set.setNumber,
      setType: set.setType,
      actualWeight: weight ? parseFloat(weight) : null,
      actualReps: reps ? parseInt(reps, 10) : null,
      rpe: rpe ? parseFloat(rpe) : null,
    });
  };

  return (
    <Card className={`relative transition-colors ${isCompleted ? 'bg-muted/50 border-green-500/50' : ''}`}>
      <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center">
        <div className="w-full sm:w-16 font-medium text-sm text-muted-foreground shrink-0">
          Set {set.setNumber}
          <div className="text-xs uppercase">{set.setType}</div>
        </div>

        <div className="flex-1 grid grid-cols-3 gap-2 w-full">
          <div>
            <label className="text-xs text-muted-foreground">kg/lb</label>
            <Input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder={set.targetWeight?.toString() ?? '-'}
              className="h-12 text-lg text-center"
              disabled={isCompleted && !mutation.isPending}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Reps</label>
            <Input
              type="number"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              placeholder={set.targetReps?.toString() ?? '-'}
              className="h-12 text-lg text-center"
              disabled={isCompleted && !mutation.isPending}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">RPE (opt)</label>
            <Input
              type="number"
              step="0.5"
              value={rpe}
              onChange={(e) => setRpe(e.target.value)}
              placeholder="-"
              className="h-12 text-lg text-center"
              disabled={isCompleted && !mutation.isPending}
            />
          </div>
        </div>

        <Button
          onClick={handleDone}
          disabled={mutation.isPending}
          variant={isCompleted ? 'outline' : 'default'}
          className="w-full sm:w-24 h-12 shrink-0"
        >
          {isCompleted ? <Check className="w-6 h-6 text-green-600" /> : 'Done'}
        </Button>
      </CardContent>
    </Card>
  );
}
