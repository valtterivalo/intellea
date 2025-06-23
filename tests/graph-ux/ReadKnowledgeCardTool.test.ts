import { describe, it, expect, beforeEach } from 'vitest';
import { readKnowledgeCardTool } from '@/lib/agents/tools';
import { useAppStore, IntelleaResponse } from '@/store/useAppStore';

const mockOutput: IntelleaResponse = {
  explanationMarkdown: null,
  knowledgeCards: [
    { nodeId: '1', title: 'One', description: 'Card for one' }
  ],
  visualizationData: {
    nodes: [],
    links: []
  }
};

describe('read_knowledge_card tool', () => {
  beforeEach(() => {
    useAppStore.setState({
      isVoiceSessionActive: true,
      output: mockOutput,
      nodeNotes: { '1': 'My personal note' }
    });
  });

  it('reads the card description and note', async () => {
    const result = await readKnowledgeCardTool.invoke({} as any, JSON.stringify({ nodeId: '1' }));
    expect(result).toContain('Card for one');
    expect(result).toContain('My personal note');
  });
});
