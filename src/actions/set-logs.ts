'use server';

import prisma from '@/lib/prisma';

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
    const { id, ...restData } = data;

    if (id) {
      const updated = await prisma.setLog.update({
        where: { id },
        data: restData,
      });
      return { data: updated, error: null };
    } else {
      const created = await prisma.setLog.create({
        data: {
          ...restData,
          completedAt: new Date(),
        },
      });
      return { data: created, error: null };
    }
  } catch (error) {
    console.error('Error saving set log:', error);
    return { data: null, error: 'Failed to save set log' };
  }
}
