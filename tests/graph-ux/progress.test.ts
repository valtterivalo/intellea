import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/store/useAppStore';
import { computeProgress } from '@/lib/progress';

describe('Completion progress', () => {
  beforeEach(() => {
    useAppStore.setState({ completedNodeIds: new Set() });
  });

  it('marks nodes as completed', () => {
    useAppStore.getState().markCompleted('a');
    expect(useAppStore.getState().completedNodeIds.has('a')).toBe(true);
  });

  it('computes progress percentage', () => {
    useAppStore.getState().markCompleted('a');
    useAppStore.getState().markCompleted('b');
    const pct = computeProgress(4, useAppStore.getState().completedNodeIds);
    expect(pct).toBeCloseTo(50); // 2 of 4
  });
});
