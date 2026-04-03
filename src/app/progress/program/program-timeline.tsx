'use client';

import { TimelineWeek, TimelineDay } from '@/lib/progress';
import { CheckCircle, Circle, Sparkles } from 'lucide-react';

function DayDot({ day, onSelect }: { day: TimelineDay; onSelect: (day: TimelineDay) => void }) {
  const handleClick = () => {
    if (day.status === 'completed' && day.workoutLogId) {
      onSelect(day);
    }
  };

  if (day.status === 'completed') {
    return (
      <button
        onClick={handleClick}
        className="w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors cursor-pointer"
        title={`${day.label} - Tap to see summary`}
      >
        <CheckCircle className="w-5 h-5 text-white" />
      </button>
    );
  }

  if (day.status === 'current') {
    return (
      <div
        className="w-10 h-10 rounded-full bg-primary flex items-center justify-center animate-pulse"
        title={`${day.label} - Current`}
      >
        <Sparkles className="w-5 h-5 text-white" />
      </div>
    );
  }

  return (
    <div
      className="w-10 h-10 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center"
      title={`${day.label} - Upcoming`}
    >
      <Circle className="w-5 h-5 text-muted-foreground/30" />
    </div>
  );
}

export default function ProgramTimeline({
  weeks,
  onSelectDay,
}: {
  weeks: TimelineWeek[];
  onSelectDay: (day: TimelineDay) => void;
}) {
  return (
    <div className="space-y-6">
      {weeks.map((week) => (
        <div key={week.weekNumber} className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-muted-foreground">
              Week {week.weekNumber}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="flex gap-3 flex-wrap">
            {week.days.map((day) => (
              <DayDot
                key={`${day.week}-${day.day}`}
                day={day}
                onSelect={onSelectDay}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}