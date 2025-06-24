import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { searchAndSelectNodeTool } from '@/lib/agents/tools';
import { useAppStore, IntelleaResponse } from '@/store/useAppStore';

const mockOutput: IntelleaResponse = {
  explanationMarkdown: null,
  knowledgeCards: [],
  visualizationData: {
    nodes: [
      { id: '1', label: 'Alpha' },
      { id: '2', label: 'Beta' },
      { id: '3', label: 'Gamma' },
    ],
    links: [],
  },
};

describe('search_and_select_node tool', () => {
  beforeEach(() => {
    useAppStore.setState({
      isVoiceSessionActive: true,
      output: mockOutput,
      selectedNodeId: null,
      focusedNodeId: null,
      activeFocusPathIds: null,
    });
  });

  it('selects the first node matching the prefix', async () => {
    await act(async () => {
      await searchAndSelectNodeTool.invoke({} as any, JSON.stringify({ labelStartsWith: 'ga' }));
    });
    expect(useAppStore.getState().selectedNodeId).toBe('3');
    expect(useAppStore.getState().activeFocusPathIds?.has('3')).toBe(true);
  });
});
