import { describe, it, expect } from 'vitest';
import assert from 'node:assert';
import {
  calculateTargetWeight,
  calculateWarmupPyramid,
  estimateOneRepMax,
  convertUnit,
} from './calculations';

describe('calculations', () => {
  describe('calculateTargetWeight', () => {
    it('calculates and rounds correctly for kg (nearest 2.5kg)', () => {
      // 100 * 0.73 = 73. Should round to 72.5
      assert.strictEqual(calculateTargetWeight(100, 73, 'kg'), 72.5);
      // 100 * 0.74 = 74. Should round to 75
      assert.strictEqual(calculateTargetWeight(100, 74, 'kg'), 75);
    });

    it('calculates and rounds correctly for lb (nearest 5lb)', () => {
      // 200 * 0.73 = 146. Should round to 145
      assert.strictEqual(calculateTargetWeight(200, 73, 'lb'), 145);
      // 200 * 0.74 = 148. Should round to 150
      assert.strictEqual(calculateTargetWeight(200, 74, 'lb'), 150);
    });
  });

  describe('estimateOneRepMax', () => {
    it('estimates 1RM using Epley formula', () => {
      // 100 * (1 + 5/30) = 100 * (1 + 1/6) = 116.666...
      const result = estimateOneRepMax(100, 5);
      assert.ok(Math.abs(result - 116.666) < 0.01);
    });

    it('returns weight when reps is 1', () => {
      assert.strictEqual(estimateOneRepMax(100, 1), 100);
    });

    it('returns 0 when reps is 0 or negative', () => {
      assert.strictEqual(estimateOneRepMax(100, 0), 0);
      assert.strictEqual(estimateOneRepMax(100, -1), 0);
    });
  });

  describe('convertUnit', () => {
    it('converts kg to lb', () => {
      const result = convertUnit(100, 'kg', 'lb');
      assert.ok(Math.abs(result - 220.462) < 0.01);
    });

    it('converts lb to kg', () => {
      const result = convertUnit(220.462, 'lb', 'kg');
      assert.ok(Math.abs(result - 100) < 0.01);
    });

    it('returns same value if units are the same', () => {
      assert.strictEqual(convertUnit(100, 'kg', 'kg'), 100);
      assert.strictEqual(convertUnit(100, 'lb', 'lb'), 100);
    });
  });

  describe('calculateWarmupPyramid', () => {
    it('returns warmup pyramid in kg', () => {
      const pyramid = calculateWarmupPyramid(100, 'kg');
      assert.deepStrictEqual(pyramid, [
        { set: 1, weight: 20, reps: 10, label: 'Empty Bar' },
        { set: 2, weight: 50, reps: 5, label: '50%' }, // 100 * 0.5 = 50
        { set: 3, weight: 70, reps: 3, label: '70%' }, // 100 * 0.7 = 70
        { set: 4, weight: 85, reps: 1, label: '85%' }, // 100 * 0.85 = 85
        { set: 5, weight: 100, reps: 1, label: 'Working Weight' },
      ]);
    });

    it('returns warmup pyramid in lb with rounding to nearest 5', () => {
      const pyramid = calculateWarmupPyramid(225, 'lb');
      assert.deepStrictEqual(pyramid, [
        { set: 1, weight: 45, reps: 10, label: 'Empty Bar' },
        { set: 2, weight: 115, reps: 5, label: '50%' }, // 225 * 0.5 = 112.5 -> 115 (or 110? standard round to nearest 5 is math.round(val/5)*5. 112.5/5 = 22.5. Rounding 22.5 -> 23 -> 115)
        { set: 3, weight: 160, reps: 3, label: '70%' }, // 225 * 0.7 = 157.5 -> 160
        { set: 4, weight: 190, reps: 1, label: '85%' }, // 225 * 0.85 = 191.25 -> 190
        { set: 5, weight: 225, reps: 1, label: 'Working Weight' },
      ]);
    });

    it('handles working weights below the empty bar', () => {
      const pyramid = calculateWarmupPyramid(15, 'kg');
      assert.deepStrictEqual(pyramid, [
        { set: 1, weight: 15, reps: 1, label: 'Working Weight' },
      ]);
    });
  });
});
