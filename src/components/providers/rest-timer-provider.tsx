'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';

type RestTimerContextType = {
  isActive: boolean;
  timeLeft: number;
  startTimer: (seconds: number) => void;
  stopTimer: () => void;
};

const RestTimerContext = createContext<RestTimerContextType | undefined>(undefined);

export function RestTimerProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const endTimeRef = useRef<number | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const checkTime = () => {
      if (!endTimeRef.current) return;
      
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setTimeLeft(remaining);
      
      if (remaining === 0) {
        setIsActive(false);
        endTimeRef.current = null;
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
      }
    };

    if (isActive) {
      interval = setInterval(checkTime, 500);
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isActive) {
        checkTime();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive]);

  const startTimer = (seconds: number) => {
    endTimeRef.current = Date.now() + seconds * 1000;
    setTimeLeft(seconds);
    setIsActive(true);
  };

  const stopTimer = () => {
    setIsActive(false);
    setTimeLeft(0);
    endTimeRef.current = null;
  };

  return (
    <RestTimerContext.Provider value={{ isActive, timeLeft, startTimer, stopTimer }}>
      {children}
    </RestTimerContext.Provider>
  );
}

export function useRestTimer() {
  const context = useContext(RestTimerContext);
  if (!context) {
    throw new Error('useRestTimer must be used within a RestTimerProvider');
  }
  return context;
}
