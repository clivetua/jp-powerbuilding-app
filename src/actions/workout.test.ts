import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import { PrismaClient } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getOrCreateWorkoutLog } from './workout';
import { getUser } from '@/lib/auth';

vi.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));

const prismaMock = prisma as unknown as ReturnType<typeof mockDeep<PrismaClient>>;

vi.mock('@/lib/auth', () => ({
  getUser: vi.fn()
}));

describe('getOrCreateWorkoutLog', () => {
  beforeEach(() => {
    mockReset(prismaMock);
    vi.mocked(getUser).mockResolvedValue({ id: 'test-user-id' } as any);
  });

  it('creates a new workout log if none exists today', async () => {
    prismaMock.cycle.findFirst.mockResolvedValue({
      id: 'test-cycle-id',
      userId: 'test-user-id',
      programId: 'prog-1',
      startDate: new Date(),
      status: 'active',
      currentWeek: 1,
      squat1rm: null,
      bench1rm: null,
      deadlift1rm: null,
      notes: null,
    });

    prismaMock.workoutLog.findFirst.mockResolvedValue(null);

    const mockNewLog = {
      id: 'new-log-id',
      userId: 'test-user-id',
      cycleId: 'test-cycle-id',
      programWorkoutId: 'workout-1',
      startedAt: new Date(),
      completedAt: null,
      durationSeconds: null,
      sessionRpe: null,
      notes: null
    };
    prismaMock.workoutLog.create.mockResolvedValue(mockNewLog);

    const result = await getOrCreateWorkoutLog('workout-1');

    expect(result.data).toEqual(mockNewLog);
    expect(prismaMock.workoutLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        programWorkoutId: 'workout-1',
        userId: 'test-user-id',
        cycleId: 'test-cycle-id',
      })
    }));
  });

  it('returns existing incomplete workout log if one exists today', async () => {
    prismaMock.cycle.findFirst.mockResolvedValue({
      id: 'test-cycle-id',
      userId: 'test-user-id',
      programId: 'prog-1',
      startDate: new Date(),
      status: 'active',
      currentWeek: 1,
      squat1rm: null,
      bench1rm: null,
      deadlift1rm: null,
      notes: null
    });

    const existingLog = {
      id: 'existing-log-id',
      userId: 'test-user-id',
      cycleId: 'test-cycle-id',
      programWorkoutId: 'workout-1',
      startedAt: new Date(),
      completedAt: null,
      durationSeconds: null,
      sessionRpe: null,
      notes: null
    };
    prismaMock.workoutLog.findFirst.mockResolvedValue(existingLog);

    const result = await getOrCreateWorkoutLog('workout-1');

    expect(result.data).toEqual(existingLog);
    expect(prismaMock.workoutLog.create).not.toHaveBeenCalled();
  });

  it('returns error when user is not logged in', async () => {
    vi.mocked(getUser).mockResolvedValue(null);

    const result = await getOrCreateWorkoutLog('workout-1');

    expect(result).toEqual({ error: 'Unauthorized', data: null });
    expect(prismaMock.cycle.findFirst).not.toHaveBeenCalled();
  });

  it('returns error when there is no active cycle', async () => {
    prismaMock.cycle.findFirst.mockResolvedValue(null);

    const result = await getOrCreateWorkoutLog('workout-1');

    expect(result).toEqual({ error: 'No active cycle found', data: null });
    expect(prismaMock.workoutLog.findFirst).not.toHaveBeenCalled();
  });
});
