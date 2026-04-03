'use server';

import { getUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function getUserCycles() {
  const user = await getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  const cycles = await prisma.cycle.findMany({
    where: { userId: user.id },
  });

  return cycles;
}
