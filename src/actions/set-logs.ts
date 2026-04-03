'use server';

import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { checkIfPR } from '@/lib/calculations';

export type SaveSetLogInput = {
  id?: string;
  workoutLogId: string;
  exerciseId: string;
  setNumber: number;
  setType: string;
  targetWeight?: number | null;
  actualWeight?: number | null;
  targetReps?: number | null;
  actualReps?: number | null;
  rpe?: number | null;
  completedAt?: Date | null;
};

export async function saveSetLog(data: SaveSetLogInput) {
  try {
    const user = await getUser();
    if (!user) {
      return { data: null, error: 'Unauthorized' };
    }

    const { id, ...restData } = data;

    let savedSetLog;
    if (id) {
      savedSetLog = await prisma.setLog.update({
        where: { id },
        data: restData,
      });
    } else {
      savedSetLog = await prisma.setLog.create({
        data: {
          ...restData,
          completedAt: new Date(),
        },
      });
    }

    let isPR = false;

    // Only check for PR if actual weight and reps are present
    if (savedSetLog.actualWeight && savedSetLog.actualReps && savedSetLog.actualWeight > 0 && savedSetLog.actualReps > 0) {
      // Fetch previous sets for this exercise and user
      // Exclude the current set being saved/updated
      const previousSets = await prisma.setLog.findMany({
        where: {
          exerciseId: savedSetLog.exerciseId,
          workoutLog: {
            userId: user.id,
          },
          id: {
            not: savedSetLog.id,
          },
          actualWeight: { not: null },
          actualReps: { not: null },
        },
        select: {
          actualWeight: true,
          actualReps: true,
        },
      });

      // Map to the format expected by checkIfPR
      const formattedPreviousSets = previousSets.map(s => ({
        weight: s.actualWeight!,
        reps: s.actualReps!,
      }));

      const currentSetInfo = {
        weight: savedSetLog.actualWeight,
        reps: savedSetLog.actualReps,
      };

      isPR = checkIfPR(currentSetInfo, formattedPreviousSets);
    }

    return { data: { ...savedSetLog, isPR }, error: null };
  } catch (error) {
    console.error('Error saving set log:', error);
    return { data: null, error: 'Failed to save set log' };
  }
}
