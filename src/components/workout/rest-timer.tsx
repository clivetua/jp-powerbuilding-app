'use client';

import React from 'react';
import { useRestTimer } from '@/components/providers/rest-timer-provider';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';

export function RestTimer() {
  const { isActive, timeLeft, stopTimer, addTime } = useRestTimer();

  if (!isActive) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg p-4 flex items-center justify-between z-50 animate-in slide-in-from-bottom-full duration-300 sm:bottom-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-[400px] sm:rounded-xl sm:border">
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Rest Timer</span>
        <span className="text-3xl font-bold tabular-nums leading-none mt-1">{timeString}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => addTime(30)} className="h-10 px-3">
          <Plus className="w-4 h-4 mr-1" />
          30s
        </Button>
        <Button variant="ghost" size="icon" onClick={stopTimer} aria-label="Skip timer" className="h-10 w-10 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
