import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import { PrismaClient } from '@/generated/prisma/client';
import prisma from '@/lib/prisma';
import { saveSetLog } from './set-logs';

vi.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));

const prismaMock = prisma as unknown as ReturnType<typeof mockDeep<PrismaClient>>;

describe('saveSetLog', () => {
  beforeEach(() => {
    mockReset(prismaMock);
  });

  it('creates a new SetLog if id is not provided', async () => {
    const mockNewSetLog = {
      id: 'new-set-log-id',
      workoutLogId: 'wlog-1',
      exerciseId: 'ex-1',
      setNumber: 1,
      setType: 'working',
      targetWeight: 100,
      actualWeight: 100,
      targetReps: 5,
      actualReps: 5,
      rpe: 8,
      completedAt: new Date('2024-01-01T12:00:00Z'),
    };
    
    prismaMock.setLog.create.mockResolvedValue(mockNewSetLog);

    const inputData = {
      workoutLogId: 'wlog-1',
      exerciseId: 'ex-1',
      setNumber: 1,
      setType: 'working',
      targetWeight: 100,
      actualWeight: 100,
      targetReps: 5,
      actualReps: 5,
      rpe: 8,
    };

    const result = await saveSetLog(inputData);

    expect(result.data).toEqual(mockNewSetLog);
    expect(prismaMock.setLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ...inputData,
        completedAt: expect.any(Date),
      })
    });
  });

  it('updates an existing SetLog if id is provided', async () => {
    const mockUpdatedSetLog = {
      id: 'existing-id',
      workoutLogId: 'wlog-1',
      exerciseId: 'ex-1',
      setNumber: 1,
      setType: 'working',
      targetWeight: 100,
      actualWeight: 105,
      targetReps: 5,
      actualReps: 6,
      rpe: 9,
      completedAt: new Date('2024-01-01T12:00:00Z'),
    };
    
    prismaMock.setLog.update.mockResolvedValue(mockUpdatedSetLog);

    const inputData = {
      id: 'existing-id',
      workoutLogId: 'wlog-1',
      exerciseId: 'ex-1',
      setNumber: 1,
      setType: 'working',
      actualWeight: 105,
      actualReps: 6,
      rpe: 9,
    };

    const result = await saveSetLog(inputData);

    expect(result.data).toEqual(mockUpdatedSetLog);
    expect(prismaMock.setLog.update).toHaveBeenCalledWith({
      where: { id: 'existing-id' },
      data: expect.objectContaining({
        actualWeight: 105,
        actualReps: 6,
        rpe: 9,
      })
    });
  });
});
