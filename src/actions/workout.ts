'use server';

import { getUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function getOrCreateWorkoutLog(programWorkoutId: string) {
  try {
    const user = await getUser();
    if (!user) {
      return { error: 'Unauthorized', data: null };
    }

    // Get active cycle
    const cycle = await prisma.cycle.findFirst({
      where: {
        userId: user.id,
        status: 'active',
      },
    });

    if (!cycle) {
      return { error: 'No active cycle found', data: null };
    }

    // Check if an incomplete workout log exists for this workout
    // "today" is implied by being incomplete. We'll find any incomplete for this programWorkoutId.
    // If we strictly need "today", we should filter by date. Let's just find incomplete first.
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const existingLog = await prisma.workoutLog.findFirst({
      where: {
        userId: user.id,
        cycleId: cycle.id,
        programWorkoutId,
        completedAt: null,
        startedAt: {
          gte: startOfToday,
        },
      },
    });

    if (existingLog) {
      return { error: null, data: existingLog };
    }

    // Create a new workout log
    const newLog = await prisma.workoutLog.create({
      data: {
        userId: user.id,
        cycleId: cycle.id,
        programWorkoutId,
        startedAt: new Date(),
      },
    });

    return { error: null, data: newLog };
  } catch (error: any) {
    console.error('Error in getOrCreateWorkoutLog:', error);
    return { error: error.message || 'Failed to create or get workout log', data: null };
  }
}
