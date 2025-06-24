import { describe, it, expect, beforeEach } from 'vitest';
import { updateKnowledgeCardTool } from '@/lib/agents/tools';
import { useAppStore, IntelleaResponse } from '@/store/useAppStore';

const mockOutput: IntelleaResponse = {
  explanationMarkdown: null,
  knowledgeCards: [
    { nodeId: '1', title: 'One', description: 'Old text' }
  ],
  visualizationData: {
    nodes: [ { id: '1', label: 'One' } ],
    links: []
  }
};

describe('update_knowledge_card tool', () => {
  beforeEach(() => {
    useAppStore.setState({
      isVoiceSessionActive: true,
      output: JSON.parse(JSON.stringify(mockOutput))
    });
  });

  it('updates the card description', async () => {
    await updateKnowledgeCardTool.invoke({} as any, JSON.stringify({ nodeLabel: 'One', newText: 'New text' }));
    const card = (useAppStore.getState().output as IntelleaResponse).knowledgeCards?.[0];
    expect(card?.description).toBe('New text');
  });
});
