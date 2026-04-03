'use client';

import { useState } from 'react';
import { TimelineDay, TimelineWeek, WorkoutLogData } from '@/lib/progress';
import ProgramTimeline from './program-timeline';
import WorkoutSummarySheet from './workout-summary-sheet';

type ProgramTimelineWrapperProps = {
  weeks: TimelineWeek[];
  workoutLogs: WorkoutLogData[];
};

export default function ProgramTimelineWrapper({
  weeks,
  workoutLogs,
}: ProgramTimelineWrapperProps) {
  const [selectedDay, setSelectedDay] = useState<TimelineDay | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectDay = (day: TimelineDay) => {
    if (day.status === 'completed') {
      setSelectedDay(day);
      setIsOpen(true);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedDay(null);
  };

  return (
    <>
      <ProgramTimeline weeks={weeks} onSelectDay={handleSelectDay} />
      <WorkoutSummarySheet
        workoutLogs={workoutLogs}
        selectedDay={selectedDay}
        isOpen={isOpen}
        onClose={handleClose}
      />
    </>
  );
}