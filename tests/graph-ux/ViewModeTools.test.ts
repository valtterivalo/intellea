import { describe, it, expect, beforeEach } from 'vitest';
import { showChatPanelTool, showGraphPanelTool, exitFullscreenTool } from '@/lib/agents/tools';
import { useAppStore } from '@/store/useAppStore';

describe('view mode related tools', () => {
  beforeEach(() => {
    useAppStore.setState({ viewMode: 'graph', isGraphFullscreen: true, isVoiceSessionActive: true });
  });

  it('switches to chat panel', async () => {
    await showChatPanelTool.invoke({} as any, '{}');
    expect(useAppStore.getState().viewMode).toBe('chat');
  });

  it('switches to graph panel', async () => {
    useAppStore.setState({ viewMode: 'chat', isVoiceSessionActive: true });
    await showGraphPanelTool.invoke({} as any, '{}');
    expect(useAppStore.getState().viewMode).toBe('graph');
  });

  it('exits fullscreen', async () => {
    await exitFullscreenTool.invoke({} as any, '{}');
    expect(useAppStore.getState().isGraphFullscreen).toBe(false);
  });
});
