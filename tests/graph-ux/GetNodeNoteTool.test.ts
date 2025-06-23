import { describe, it, expect, beforeEach } from 'vitest';
import { getNodeNoteTool } from '@/lib/agents/tools';
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

describe('get_node_note tool', () => {
  beforeEach(() => {
    useAppStore.setState({
      isVoiceSessionActive: true,
      nodeNotes: { '1': 'note one' },
      output: mockOutput,
    });
  });

  it('retrieves a note for a node by id', async () => {
    const res = await getNodeNoteTool.invoke({} as any, JSON.stringify({ nodeId: '1' }));
    expect(res).toBe('note one');
  });
});
