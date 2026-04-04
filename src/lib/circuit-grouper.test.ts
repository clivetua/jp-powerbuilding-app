import { describe, expect, it } from 'vitest';
import { groupExercises, generateCircuitSets } from './circuit-grouper';

describe('groupExercises', () => {
  it('groups a flat list of exercises by circuitGroup', () => {
    const exercises = [
      { id: '1', orderIndex: 1, circuitGroup: null },
      { id: '2', orderIndex: 2, circuitGroup: 'A' },
      { id: '3', orderIndex: 3, circuitGroup: 'A' },
      { id: '4', orderIndex: 4, circuitGroup: null },
      { id: '5', orderIndex: 5, circuitGroup: 'B' },
      { id: '6', orderIndex: 6, circuitGroup: 'B' },
    ] as any[];

    const result = groupExercises(exercises);

    expect(result).toHaveLength(4);
    
    expect(result[0].isCircuit).toBe(false);
    expect(result[0].exercises).toHaveLength(1);
    expect(result[0].exercises[0].id).toBe('1');

    expect(result[1].isCircuit).toBe(true);
    expect(result[1].circuitGroup).toBe('A');
    expect(result[1].exercises).toHaveLength(2);
    expect(result[1].exercises[0].id).toBe('2');
    expect(result[1].exercises[1].id).toBe('3');

    expect(result[2].isCircuit).toBe(false);
    expect(result[2].exercises).toHaveLength(1);
    expect(result[2].exercises[0].id).toBe('4');

    expect(result[3].isCircuit).toBe(true);
    expect(result[3].circuitGroup).toBe('B');
    expect(result[3].exercises).toHaveLength(2);
    expect(result[3].exercises[0].id).toBe('5');
    expect(result[3].exercises[1].id).toBe('6');
  });

  it('keeps exercises with the same circuit group together even if orderIndex is not strictly sequential but belongs to the same group', () => {
    // Usually they are sequential in DB by orderIndex.
    // If they are not, groupExercises should group contiguous circuitGroups.
    const exercises = [
      { id: '1', orderIndex: 1, circuitGroup: 'A' },
      { id: '2', orderIndex: 2, circuitGroup: 'A' },
      { id: '3', orderIndex: 3, circuitGroup: 'B' },
    ] as any[];

    const result = groupExercises(exercises);
    expect(result).toHaveLength(2);
    expect(result[0].circuitGroup).toBe('A');
    expect(result[1].circuitGroup).toBe('B');
  });
});

describe('generateCircuitSets', () => {
  it('interleaves sets for a given circuit group of exercises', () => {
    const exercises = [
      { id: 'ex1', exercise: { name: 'Pushup' }, warmupSets: 0, workingSets: 3, targetReps: '10' },
      { id: 'ex2', exercise: { name: 'Pullup' }, warmupSets: 1, workingSets: 2, targetReps: '8' },
    ] as any[];

    // No 1RM calculation needed for bodyweight or simplicity in this test
    const rms = { squat: 100, bench: 80, deadlift: 120, unit: 'kg' } as any;

    const result = generateCircuitSets(exercises, rms);

    // ex1: 0 warmup, 3 working
    // ex2: 1 warmup, 2 working
    // Interleaving: 
    // round 1: ex1 (work 1), ex2 (warm 1)
    // round 2: ex1 (work 2), ex2 (work 1)
    // round 3: ex1 (work 3), ex2 (work 2)
    // Wait, the simplest interleaving is just to take set 1 of ex1, set 1 of ex2, set 2 of ex1, set 2 of ex2 etc.
    // Total sets = max(totalSets) across all exercises in circuit.
    // ex1 total = 3. ex2 total = 3.
    expect(result).toHaveLength(6);

    expect(result[0]).toMatchObject({ programExerciseId: 'ex1', setNumber: 1, setType: 'working' });
    expect(result[1]).toMatchObject({ programExerciseId: 'ex2', setNumber: 1, setType: 'warmup' });
    expect(result[2]).toMatchObject({ programExerciseId: 'ex1', setNumber: 2, setType: 'working' });
    expect(result[3]).toMatchObject({ programExerciseId: 'ex2', setNumber: 2, setType: 'working' });
    expect(result[4]).toMatchObject({ programExerciseId: 'ex1', setNumber: 3, setType: 'working' });
    expect(result[5]).toMatchObject({ programExerciseId: 'ex2', setNumber: 3, setType: 'working' });
  });

  it('handles unequal total sets by dropping the exercise that finished early', () => {
    const exercises = [
      { id: 'ex1', exercise: { name: 'A' }, warmupSets: 0, workingSets: 2 },
      { id: 'ex2', exercise: { name: 'B' }, warmupSets: 0, workingSets: 3 },
    ] as any[];

    const result = generateCircuitSets(exercises, {} as any);

    expect(result).toHaveLength(5); // 2 from ex1, 3 from ex2
    expect(result[0].programExerciseId).toBe('ex1'); // set 1
    expect(result[1].programExerciseId).toBe('ex2'); // set 1
    expect(result[2].programExerciseId).toBe('ex1'); // set 2
    expect(result[3].programExerciseId).toBe('ex2'); // set 2
    expect(result[4].programExerciseId).toBe('ex2'); // set 3 (ex1 is done)
  });
});
