import { describe, it, expect, beforeEach } from 'vitest';
import { pinNodeTool, unpinNodeTool } from '@/lib/agents/tools';
import { useAppStore } from '@/store/useAppStore';

describe('pin_node and unpin_node tools', () => {
  beforeEach(() => {
    useAppStore.setState({ pinnedNodes: {}, isVoiceSessionActive: true });
  });

  it('pins a node when executed', async () => {
    await pinNodeTool.invoke({} as any, JSON.stringify({ nodeId: 'x' }));
    expect(useAppStore.getState().pinnedNodes).toHaveProperty('x', true);
  });

  it('unpins a node when executed', async () => {
    useAppStore.setState({ pinnedNodes: { x: true }, isVoiceSessionActive: true });
    await unpinNodeTool.invoke({} as any, JSON.stringify({ nodeId: 'x' }));
    expect(useAppStore.getState().pinnedNodes).not.toHaveProperty('x');
  });
});
