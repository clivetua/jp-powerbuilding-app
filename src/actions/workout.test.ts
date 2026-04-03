import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import { PrismaClient } from '@/generated/prisma/client';
import prisma from '@/lib/prisma';
import { getOrCreateWorkoutLog, finishWorkout, saveWorkoutSummary } from './workout';
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
      deadlift1rm: null
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

describe('finishWorkout', () => {
  beforeEach(() => {
    mockReset(prismaMock);
    vi.mocked(getUser).mockResolvedValue({ id: 'test-user-id' } as any);
  });

  it('updates workout log with completedAt and durationSeconds', async () => {
    const startedAt = new Date(Date.now() - 3600000); // 1 hour ago
    prismaMock.workoutLog.findUnique.mockResolvedValue({
      id: 'log-1',
      userId: 'test-user-id',
      cycleId: 'cycle-1',
      programWorkoutId: 'workout-1',
      startedAt,
      completedAt: null,
      durationSeconds: null,
      sessionRpe: null,
      notes: null,
    });

    const updatedLog = {
      id: 'log-1',
      userId: 'test-user-id',
      cycleId: 'cycle-1',
      programWorkoutId: 'workout-1',
      startedAt,
      completedAt: new Date(),
      durationSeconds: 3600,
      sessionRpe: null,
      notes: null,
    };
    prismaMock.workoutLog.update.mockResolvedValue(updatedLog);

    // Mock Date.now to have predictable duration
    vi.setSystemTime(startedAt.getTime() + 3600000);

    const result = await finishWorkout('log-1');

    expect(result.error).toBeNull();
    expect(result.data).toEqual(updatedLog);
    expect(prismaMock.workoutLog.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'log-1' },
      data: expect.objectContaining({
        completedAt: expect.any(Date),
        durationSeconds: 3600
      })
    }));

    vi.useRealTimers();
  });

  it('returns error when log does not exist', async () => {
    prismaMock.workoutLog.findUnique.mockResolvedValue(null);

    const result = await finishWorkout('log-1');

    expect(result).toEqual({ error: 'Workout log not found', data: null });
    expect(prismaMock.workoutLog.update).not.toHaveBeenCalled();
  });

  it('returns error when user is not authorized', async () => {
    vi.mocked(getUser).mockResolvedValue(null);

    const result = await finishWorkout('log-1');

    expect(result).toEqual({ error: 'Unauthorized', data: null });
  });

  it('returns error when user does not own the log', async () => {
    prismaMock.workoutLog.findUnique.mockResolvedValue({
      id: 'log-1',
      userId: 'other-user',
      cycleId: 'cycle-1',
      programWorkoutId: 'workout-1',
      startedAt: new Date(),
      completedAt: null,
      durationSeconds: null,
      sessionRpe: null,
      notes: null,
    });

    const result = await finishWorkout('log-1');

    expect(result).toEqual({ error: 'Workout log not found', data: null });
  });
});

describe('saveWorkoutSummary', () => {
  beforeEach(() => {
    mockReset(prismaMock);
    vi.mocked(getUser).mockResolvedValue({ id: 'test-user-id' } as any);
  });

  it('updates workout log with session RPE', async () => {
    prismaMock.workoutLog.findUnique.mockResolvedValue({
      id: 'log-1',
      userId: 'test-user-id',
      cycleId: 'cycle-1',
      programWorkoutId: 'workout-1',
      startedAt: new Date(),
      completedAt: new Date(),
      durationSeconds: 3600,
      sessionRpe: null,
      notes: null,
    });

    const updatedLog = {
      id: 'log-1',
      userId: 'test-user-id',
      cycleId: 'cycle-1',
      programWorkoutId: 'workout-1',
      startedAt: new Date(),
      completedAt: new Date(),
      durationSeconds: 3600,
      sessionRpe: 8,
      notes: null,
    };
    prismaMock.workoutLog.update.mockResolvedValue(updatedLog);

    const result = await saveWorkoutSummary('log-1', 8);

    expect(result.error).toBeNull();
    expect(result.data).toEqual(updatedLog);
    expect(prismaMock.workoutLog.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'log-1' },
      data: expect.objectContaining({
        sessionRpe: 8
      })
    }));
  });

  it('returns error when user is not authorized', async () => {
    vi.mocked(getUser).mockResolvedValue(null);

    const result = await saveWorkoutSummary('log-1', 8);

    expect(result).toEqual({ error: 'Unauthorized', data: null });
  });

  it('returns error when log does not exist', async () => {
    prismaMock.workoutLog.findUnique.mockResolvedValue(null);

    const result = await saveWorkoutSummary('log-1', 8);

    expect(result).toEqual({ error: 'Workout log not found', data: null });
  });
});
