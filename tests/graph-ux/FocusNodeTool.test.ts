import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { focusNodeTool } from '@/lib/agents/tools';
import { useAppStore, IntelleaResponse } from '@/store/useAppStore';

const mockOutput: IntelleaResponse = {
  explanationMarkdown: null,
  knowledgeCards: [],
  visualizationData: {
    nodes: [
      { id: '1', label: 'One' },
      { id: '2', label: 'Two' },
    ],
    links: [],
  },
};

describe('focus_node tool', () => {
  beforeEach(() => {
    useAppStore.setState({
      isVoiceSessionActive: true,
      selectedNodeId: '1',
      focusedNodeId: null,
      activeFocusPathIds: null,
      output: mockOutput,
    });
  });

  it('focuses a node without changing selectedNodeId', async () => {
    await act(async () => {
      await focusNodeTool.invoke({} as any, JSON.stringify({ nodeLabel: 'Two' }));
    });
    expect(useAppStore.getState().focusedNodeId).toBe('2');
    expect(useAppStore.getState().selectedNodeId).toBe('1');
    expect(useAppStore.getState().activeClickedNodeId).toBe('2');
  });
});
