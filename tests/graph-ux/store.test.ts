import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppStore, setAppStoreStorage } from '@/store/useAppStore';
import { computeClusters } from '@intellea/graph-renderer';

describe('Graph UX Zustand Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.setState({
      selectedNodeId: null,
      pinnedNodes: {},
      nodeNotes: {},
      visitedNodeIds: [],
      visibleNodeIds: new Set(),
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
    setAppStoreStorage(global.localStorage as any);
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

  it('computes clusters when setting output', () => {
    const data = {
      nodes: [
        { id: '1', label: 'Node 1' },
        { id: '2', label: 'Node 2' },
        { id: '3', label: 'Node 3' }
      ],
      links: [
        { source: '1', target: '2' }
      ]
    };
    const expected = computeClusters(data);
    useAppStore.getState().setOutput({
      explanationMarkdown: '',
      knowledgeCards: [],
      visualizationData: data
    });
    expect(useAppStore.getState().clusters).toEqual(expected);
  });

  it('cluster mapping persists after multiple updates', () => {
    const data1 = {
      nodes: [ { id: 'a', label: 'A' }, { id: 'b', label: 'B' } ],
      links: [ { source: 'a', target: 'b' } ]
    };
    const data2 = {
      nodes: [ { id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' } ],
      links: [ { source: 'a', target: 'b' }, { source: 'b', target: 'c' } ]
    };
    useAppStore.getState().setOutput({ explanationMarkdown: '', knowledgeCards: [], visualizationData: data1 });
    const first = { ...useAppStore.getState().clusters };
    useAppStore.getState().setOutput({ explanationMarkdown: '', knowledgeCards: [], visualizationData: data2 });
    expect(useAppStore.getState().clusters['a']).toBe(first['a']);
    expect(useAppStore.getState().clusters['c']).toBeDefined();
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
  });

  it('tracks visited nodes without duplicates', () => {
    useAppStore.getState().setSelectedNodeId('a');
    useAppStore.getState().setSelectedNodeId('b');
    useAppStore.getState().setSelectedNodeId('a');
    expect(useAppStore.getState().visitedNodeIds).toEqual(['a', 'b']);
  });

  it('increments zoomToFitCount when zoomGraphToFit is called', () => {
    useAppStore.setState({ zoomToFitCount: 0 });
    useAppStore.getState().zoomGraphToFit();
    expect(useAppStore.getState().zoomToFitCount).toBe(1);
    useAppStore.getState().zoomGraphToFit();
    expect(useAppStore.getState().zoomToFitCount).toBe(2);
  });
  it('scrolls to knowledge cards section', () => {
    const el = document.createElement('div');
    const spy = vi.fn();
    (el as any).scrollIntoView = spy;
    useAppStore.getState().setKnowledgeCardsRef(el);
    useAppStore.getState().scrollToKnowledgeCards();
    expect(spy).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('updates visible node ids', () => {
    const ids = new Set(['a', 'b']);
    useAppStore.getState().setVisibleNodeIds(ids);
    expect(Array.from(useAppStore.getState().visibleNodeIds)).toEqual(['a', 'b']);
  });
});
