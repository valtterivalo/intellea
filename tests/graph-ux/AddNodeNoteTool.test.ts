import { describe, it, expect, beforeEach } from 'vitest';
import { addNodeNoteTool } from '@/lib/agents/tools';
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

describe('add_node_note tool', () => {
  beforeEach(() => {
    useAppStore.setState({
      isVoiceSessionActive: true,
      nodeNotes: {},
      output: mockOutput,
    });
  });

  it('adds a note to a node referenced by label', async () => {
    await addNodeNoteTool.invoke({} as any, JSON.stringify({ nodeLabel: 'Two', note: 'my note' }));
    expect(useAppStore.getState().nodeNotes['2']).toBe('my note');
  });
});
