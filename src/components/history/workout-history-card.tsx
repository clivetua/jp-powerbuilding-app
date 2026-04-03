'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronUp, Clock, Dumbbell } from 'lucide-react';
import { formatDuration, WorkoutHistoryItem } from '@/lib/history';
import { LocalTime } from '@/components/ui/local-time';

const SET_TYPE_LABELS = {
  warmup: 'W',
  working: 'WK',
} as const;

const SET_TYPE_STYLES = {
  warmup: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  working: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
} as const;

function getSetTypeInfo(setType: string): { label: string; className: string } {
  const isWarmup = setType === 'warmup';
  return {
    label: isWarmup ? SET_TYPE_LABELS.warmup : SET_TYPE_LABELS.working,
    className: isWarmup ? SET_TYPE_STYLES.warmup : SET_TYPE_STYLES.working,
  };
}

interface WorkoutHistoryCardProps {
  workout: WorkoutHistoryItem;
}

export function WorkoutHistoryCard({ workout }: WorkoutHistoryCardProps) {
  const [expanded, setExpanded] = useState(false);

  const groupedSets = useMemo(() => {
    return workout.sets.reduce((acc, set) => {
      const exerciseName = set.exercise.name;
      if (!acc[exerciseName]) {
        acc[exerciseName] = [];
      }
      acc[exerciseName].push(set);
      return acc;
    }, {} as Record<string, WorkoutHistoryItem['sets']>);
  }, [workout.sets]);

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md"
      onClick={() => setExpanded(!expanded)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-medium">{workout.programWorkout.label}</p>
            <p className="text-sm text-muted-foreground">
              {workout.programWorkout.programWeek.program.name} — Week{' '}
              {workout.programWorkout.programWeek.weekNumber}, Day{' '}
              {workout.programWorkout.dayNumber}
            </p>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatDuration(workout.durationSeconds)}
              </span>
              <span className="flex items-center gap-1">
                <Dumbbell className="w-3.5 h-3.5" />
                {workout.totalVolume.toLocaleString()} kg
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-sm text-muted-foreground">
              {workout.completedAt && <LocalTime date={workout.completedAt} />}
            </div>
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t space-y-4">
            {Object.entries(groupedSets).map(([exerciseName, sets]) => (
              <div key={exerciseName}>
                <p className="font-medium text-sm mb-2">{exerciseName}</p>
                <div className="space-y-1">
                  {sets.map((set) => {
                    const { label, className } = getSetTypeInfo(set.setType);
                    return (
                      <div
                        key={set.id}
                        className="flex items-center justify-between text-sm bg-muted/30 rounded px-3 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-6">
                            {set.setNumber}
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${className}`}>
                            {label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span>
                            {set.actualWeight !== null
                              ? `${set.actualWeight} kg × ${set.actualReps ?? '-'}`
                              : '—'}
                          </span>
                          {set.rpe !== null && (
                            <span className="text-xs text-muted-foreground">
                              RPE {set.rpe}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
