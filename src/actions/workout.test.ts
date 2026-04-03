import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getOrCreateWorkoutLog } from './workout';

const prismaMock = vi.hoisted(() => ({
  cycle: { findFirst: vi.fn() },
  workoutLog: { findFirst: vi.fn(), create: vi.fn() }
}));

vi.mock('@/lib/prisma', () => ({
  default: prismaMock
}));

vi.mock('@/lib/auth', () => ({
  getUser: vi.fn(() => Promise.resolve({ id: 'test-user-id' }))
}));

describe('getOrCreateWorkoutLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      sessionRpe: null
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
    });

    const existingLog = {
      id: 'existing-log-id',
      userId: 'test-user-id',
      cycleId: 'test-cycle-id',
      programWorkoutId: 'workout-1',
      startedAt: new Date(),
      completedAt: null,
      durationSeconds: null,
      sessionRpe: null
    };
    prismaMock.workoutLog.findFirst.mockResolvedValue(existingLog);

    const result = await getOrCreateWorkoutLog('workout-1');

    expect(result.data).toEqual(existingLog);
    expect(prismaMock.workoutLog.create).not.toHaveBeenCalled();
  });
});
