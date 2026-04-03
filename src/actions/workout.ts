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
    // We'll find any incomplete for this programWorkoutId within the last 16 hours.
    const lookbackTime = new Date(Date.now() - 16 * 60 * 60 * 1000);

    const existingLog = await prisma.workoutLog.findFirst({
      where: {
        userId: user.id,
        cycleId: cycle.id,
        programWorkoutId,
        completedAt: null,
        startedAt: {
          gte: lookbackTime,
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
  } catch (error: unknown) {
    console.error('Error in getOrCreateWorkoutLog:', error);
    const message = error instanceof Error ? error.message : 'Failed to create or get workout log';
    return { error: message, data: null };
  }
}
