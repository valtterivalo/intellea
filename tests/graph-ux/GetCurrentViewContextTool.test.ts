import { describe, it, expect, beforeEach } from 'vitest';
import { getCurrentViewContextTool } from '@/lib/agents/tools';
import { useAppStore, IntelleaResponse } from '@/store/useAppStore';

const mockOutput: IntelleaResponse = {
  explanationMarkdown: '',
  knowledgeCards: [
    { nodeId: '1', title: 'Card A', content: '' } as any,
    { nodeId: '2', title: 'Card B', content: '' } as any,
  ],
  visualizationData: {
    nodes: [
      { id: '1', label: 'A' },
      { id: '2', label: 'B' },
    ],
    links: [],
  },
};

describe('get_current_view_context tool', () => {
  beforeEach(() => {
    useAppStore.setState({
      isVoiceSessionActive: true,
      output: mockOutput,
      activePrompt: 'Test Topic',
      selectedNodeId: null,
      expandedConceptData: null,
      isGraphFullscreen: false,
      pinnedNodes: { '1': true },
      completedNodeIds: new Set(['1']),
    });
  });

  it('includes pinned count and progress in summary', async () => {
    const summary = await getCurrentViewContextTool.invoke({} as any, '{}');
    expect(summary).toContain('1 pinned nodes');
    expect(summary).toContain('50%');
  });
});
