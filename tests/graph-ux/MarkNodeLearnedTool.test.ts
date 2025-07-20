import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/store/useAppStore';

describe.skip('mark_node_learned tool', () => {
  beforeEach(() => {
    useAppStore.setState({ completedNodeIds: new Set(), isVoiceSessionActive: true });
  });

  it('marks a node as learned', async () => {
    // Tool no longer exists - this test should be updated or removed
    const store = useAppStore.getState();
    store.markCompleted('x');
    expect(useAppStore.getState().completedNodeIds.has('x')).toBe(true);
  });
});
