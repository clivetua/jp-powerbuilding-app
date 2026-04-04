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

export async function finishWorkout(workoutLogId: string) {
  try {
    const user = await getUser();
    if (!user) {
      return { error: 'Unauthorized', data: null };
    }

    const log = await prisma.workoutLog.findUnique({
      where: { id: workoutLogId },
    });

    if (!log || log.userId !== user.id) {
      return { error: 'Workout log not found', data: null };
    }

    if (log.completedAt) {
      return { error: null, data: log };
    }

    const completedAt = new Date();
    const durationSeconds = Math.floor((completedAt.getTime() - log.startedAt.getTime()) / 1000);

    const updatedLog = await prisma.workoutLog.update({
      where: { id: workoutLogId },
      data: {
        completedAt,
        durationSeconds,
      },
    });

    return { error: null, data: updatedLog };
  } catch (error: unknown) {
    console.error('Error in finishWorkout:', error);
    const message = error instanceof Error ? error.message : 'Failed to finish workout';
    return { error: message, data: null };
  }
}

export async function saveWorkoutSummary(workoutLogId: string, sessionRpe: number) {
  try {
    if (sessionRpe < 1 || sessionRpe > 10) {
      return { error: 'Invalid RPE', data: null };
    }

    const user = await getUser();
    if (!user) {
      return { error: 'Unauthorized', data: null };
    }

    const log = await prisma.workoutLog.findUnique({
      where: { id: workoutLogId },
    });

    if (!log || log.userId !== user.id) {
      return { error: 'Workout log not found', data: null };
    }

    const updatedLog = await prisma.workoutLog.update({
      where: { id: workoutLogId },
      data: {
        sessionRpe,
      },
    });

    return { error: null, data: updatedLog };
  } catch (error: unknown) {
    console.error('Error in saveWorkoutSummary:', error);
    const message = error instanceof Error ? error.message : 'Failed to save workout summary';
    return { error: message, data: null };
  }
}
