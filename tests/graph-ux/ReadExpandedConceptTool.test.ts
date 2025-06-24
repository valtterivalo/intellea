import { describe, it, expect, beforeEach } from 'vitest';
import { readExpandedConceptTool } from '@/lib/agents/tools';
import { useAppStore } from '@/store/useAppStore';

const mockConcept = {
  title: 'Concept',
  content: 'Detailed explanation',
  relatedConcepts: []
};

describe('read_expanded_concept tool', () => {
  beforeEach(() => {
    useAppStore.setState({
      isVoiceSessionActive: true,
      expandedConceptData: mockConcept as any,
      focusedNodeId: '1',
      nodeNotes: { '1': 'note' }
    });
  });

  it('reads the expanded concept content and note', async () => {
    const res = await readExpandedConceptTool.invoke({} as any, '{}');
    expect(res).toContain('Detailed explanation');
    expect(res).toContain('note');
  });
});
