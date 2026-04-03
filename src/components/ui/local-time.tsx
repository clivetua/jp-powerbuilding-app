'use client';

import { useEffect, useState } from 'react';

interface LocalTimeProps {
  date: Date | string;
  format?: Intl.DateTimeFormatOptions;
  fallback?: string;
}

export function LocalTime({ 
  date, 
  format = { month: 'short', day: 'numeric' },
  fallback = ''
}: LocalTimeProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return empty or fallback during SSR to avoid hydration mismatch
    return <>{fallback}</>;
  }

  const d = new Date(date);
  return <>{d.toLocaleDateString(undefined, format)}</>;
}
