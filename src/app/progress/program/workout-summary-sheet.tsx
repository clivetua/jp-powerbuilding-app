'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { TimelineDay, WorkoutLogData } from '@/lib/progress';
import { Clock, Dumbbell, Flame } from 'lucide-react';

type WorkoutSummarySheetProps = {
  workoutLogs: WorkoutLogData[];
  selectedDay: TimelineDay | null;
  isOpen: boolean;
  onClose: () => void;
};

export default function WorkoutSummarySheet({
  workoutLogs,
  selectedDay,
  isOpen,
  onClose,
}: WorkoutSummarySheetProps) {
  const workoutLogMap = new Map(
    workoutLogs.map((log) => [log.programWorkoutId, log])
  );

  const workoutLog = selectedDay?.workoutLogId
    ? workoutLogMap.get(selectedDay.programWorkoutId) ?? null
    : null;

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  const formatVolume = (volume: number) => {
    if (volume === 0) return '-';
    return `${volume.toLocaleString()} kg`;
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>
            {selectedDay?.label ?? 'Workout Summary'}
          </SheetTitle>
          <SheetDescription>
            {selectedDay && `Week ${selectedDay.week} - ${selectedDay.label}`}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {workoutLog ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs">Duration</span>
                    </div>
                    <p className="text-lg font-semibold">
                      {formatDuration(workoutLog.durationSeconds)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Dumbbell className="w-4 h-4" />
                      <span className="text-xs">Volume</span>
                    </div>
                    <p className="text-lg font-semibold">
                      {formatVolume(workoutLog.totalVolume)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Flame className="w-4 h-4" />
                      <span className="text-xs">RPE</span>
                    </div>
                    <p className="text-lg font-semibold">
                      {workoutLog.sessionRpe ?? '-'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Exercises
                </h4>
                {workoutLog.sets
                  .filter((s, i, arr) => arr.findIndex((x) => x.exerciseId === s.exerciseId) === i)
                  .map((set) => {
                    const exerciseSets = workoutLog.sets.filter(
                      (s) => s.exerciseId === set.exerciseId
                    );
                    const workingSets = exerciseSets.filter((s) => s.setType === 'working');
                    const totalVolume = workingSets.reduce(
                      (sum, s) =>
                        sum + (s.actualWeight ?? 0) * (s.actualReps ?? 0),
                      0
                    );

                    return (
                      <Card key={set.exerciseId}>
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{set.exercise.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {workingSets.length} sets
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                {formatVolume(totalVolume)}
                              </p>
                              <p className="text-xs text-muted-foreground">volume</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No workout data available
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
