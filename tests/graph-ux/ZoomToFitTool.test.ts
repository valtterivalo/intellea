import { describe, it, expect, beforeEach } from 'vitest';
import { zoomToFitGraphTool } from '@/lib/agents/tools';
import { useAppStore } from '@/store/useAppStore';

// simple test for the voice agent tool

describe('zoom_to_fit_graph tool', () => {
  beforeEach(() => {
    useAppStore.setState({ zoomToFitCount: 0, isVoiceSessionActive: true });
  });

  it('triggers zoomGraphToFit action when executed', async () => {
    await zoomToFitGraphTool.invoke({} as any, '{}');
    expect(useAppStore.getState().zoomToFitCount).toBe(1);
  });
});
