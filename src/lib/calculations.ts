export function calculateTargetWeight(baseWeight: number, percentage: number, unit: 'kg' | 'lb'): number {
  const rawWeight = baseWeight * (percentage / 100);
  if (unit === 'kg') {
    return Math.round(rawWeight / 2.5) * 2.5;
  } else {
    return Math.round(rawWeight / 5) * 5;
  }
}

export function estimateOneRepMax(weight: number, reps: number): number {
  if (reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

export function convertUnit(weight: number, from: 'kg' | 'lb', to: 'kg' | 'lb'): number {
  if (from === to) return weight;
  
  if (from === 'kg' && to === 'lb') {
    return weight * 2.20462;
  } else {
    return weight / 2.20462;
  }
}

export function calculateWarmupPyramid(
  workingWeight: number, 
  unit: 'kg' | 'lb'
): Array<{ set: number, weight: number, reps: number, label: string }> {
  const emptyBar = unit === 'kg' ? 20 : 45;
  
  if (workingWeight <= emptyBar) {
    return [{ set: 1, weight: workingWeight, reps: 1, label: 'Working Weight' }];
  }

  const pyramid = [
    { set: 1, weight: emptyBar, reps: 10, label: 'Empty Bar' }
  ];

  const steps = [
    { p: 50, reps: 5, label: '50%' },
    { p: 70, reps: 3, label: '70%' },
    { p: 85, reps: 1, label: '85%' },
  ];

  let currentSet = 2;
  for (const step of steps) {
    const stepWeight = calculateTargetWeight(workingWeight, step.p, unit);
    if (stepWeight > emptyBar && stepWeight < workingWeight) {
      pyramid.push({
        set: currentSet++,
        weight: stepWeight,
        reps: step.reps,
        label: step.label,
      });
    }
  }

  pyramid.push({
    set: currentSet,
    weight: workingWeight,
    reps: 1,
    label: 'Working Weight'
  });

  return pyramid;
}

export function checkIfPR(
  newSet: { weight: number; reps: number },
  previousSets: Array<{ weight: number; reps: number }>
): boolean {
  if (previousSets.length === 0) {
    return true;
  }

  const new1RM = estimateOneRepMax(newSet.weight, newSet.reps);
  
  const previous1RMs = previousSets.map(set => estimateOneRepMax(set.weight, set.reps));
  const maxPrevious1RM = Math.max(...previous1RMs);

  return new1RM > maxPrevious1RM;
}
