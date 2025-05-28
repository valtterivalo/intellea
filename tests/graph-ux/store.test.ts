import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/store/useAppStore';

describe('Graph UX Zustand Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.setState({
      selectedNodeId: null,
      pinnedNodes: {},
      nodeNotes: {},
      visitedNodeIds: [],
    });
    let storage: Record<string, string> = {};
    global.localStorage = {
      getItem: (key: string) => (key in storage ? storage[key] : null),
      setItem: (key: string, value: string) => {
        storage[key] = value;
      },
      removeItem: (key: string) => {
        delete storage[key];
      },
      clear: () => {
        storage = {};
      },
    } as any;
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

  it('should set and get node notes', () => {
    useAppStore.getState().setNodeNote('node-3', 'my note');
    expect(useAppStore.getState().nodeNotes['node-3']).toBe('my note');
  });

  it('persists notes to localStorage', () => {
    useAppStore.getState().setNodeNote('node-4', 'memo');
    const raw = global.localStorage.getItem('intellea-session-storage');
    expect(raw).not.toBeNull();
    const saved = JSON.parse(raw as string);
    expect(saved.state.nodeNotes['node-4']).toBe('memo');
  it('tracks visited nodes without duplicates', () => {
    useAppStore.getState().setSelectedNodeId('a');
    useAppStore.getState().setSelectedNodeId('b');
    useAppStore.getState().setSelectedNodeId('a');
    expect(useAppStore.getState().visitedNodeIds).toEqual(['a', 'b']);
  });
});
