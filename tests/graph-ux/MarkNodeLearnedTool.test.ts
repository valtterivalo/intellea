import { describe, it, expect, beforeEach } from 'vitest';
import { markNodeLearnedTool } from '@/lib/agents/tools';
import { useAppStore } from '@/store/useAppStore';

describe('mark_node_learned tool', () => {
  beforeEach(() => {
    useAppStore.setState({ completedNodeIds: new Set(), isVoiceSessionActive: true });
  });

  it('marks a node as learned', async () => {
    await markNodeLearnedTool.invoke({} as any, JSON.stringify({ nodeId: 'x' }));
    expect(useAppStore.getState().completedNodeIds.has('x')).toBe(true);
  });
});
