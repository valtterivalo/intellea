import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/store/useAppStore';

describe('Graph UX Zustand Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.setState({
      selectedNodeId: null,
      pinnedNodes: {},
      visitedNodeIds: [],
    });
  });

  it('should set selectedNodeId', () => {
    useAppStore.getState().setSelectedNodeId('node-1');
    expect(useAppStore.getState().selectedNodeId).toBe('node-1');
    useAppStore.getState().setSelectedNodeId(null);
    expect(useAppStore.getState().selectedNodeId).toBeNull();
  });

  it('should pin and unpin nodes', () => {
    useAppStore.getState().pinNode('node-2');
    expect(useAppStore.getState().pinnedNodes).toHaveProperty('node-2', true);
    useAppStore.getState().unpinNode('node-2');
    expect(useAppStore.getState().pinnedNodes).not.toHaveProperty('node-2');
  });

  it('should allow multiple nodes to be pinned', () => {
    useAppStore.getState().pinNode('a');
    useAppStore.getState().pinNode('b');
    expect(useAppStore.getState().pinnedNodes).toMatchObject({ a: true, b: true });
    useAppStore.getState().unpinNode('a');
    expect(useAppStore.getState().pinnedNodes).toMatchObject({ b: true });
  });

  it('tracks visited nodes without duplicates', () => {
    useAppStore.getState().setSelectedNodeId('a');
    useAppStore.getState().setSelectedNodeId('b');
    useAppStore.getState().setSelectedNodeId('a');
    expect(useAppStore.getState().visitedNodeIds).toEqual(['a', 'b']);
  });
});
