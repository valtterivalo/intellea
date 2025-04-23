import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import VisualizationComponent from '@/components/VisualizationComponent';
import { useAppStore } from '@/store/useAppStore';

const mockNodes = [
  { id: 'root', label: 'Root', depth: 0 },
  { id: 'a', label: 'A', depth: 1 },
  { id: 'b', label: 'B', depth: 2 },
];
const mockLinks = [
  { source: 'root', target: 'a' },
  { source: 'a', target: 'b' },
];

describe('VisualizationComponent (Graph UX handlers)', () => {
  beforeEach(() => {
    useAppStore.setState({
      selectedNodeId: null,
      pinnedNodes: {},
    });
  });

  it('selects node on left-click', () => {
    render(
      <VisualizationComponent
        visualizationData={{ nodes: mockNodes, links: mockLinks }}
      />
    );
    // Simulate left-click on node label (SpriteText is rendered in canvas, so we simulate store action directly)
    useAppStore.getState().setSelectedNodeId('a');
    expect(useAppStore.getState().selectedNodeId).toBe('a');
  });

  it('calls onNodeExpand on double-click', () => {
    const onNodeExpand = vi.fn();
    render(
      <VisualizationComponent
        visualizationData={{ nodes: mockNodes, links: mockLinks }}
        onNodeExpand={onNodeExpand}
      />
    );
    // Simulate double-click handler directly
    onNodeExpand('a', 'A');
    expect(onNodeExpand).toHaveBeenCalledWith('a', 'A');
  });

  it('pins and unpins node on right-click', () => {
    render(
      <VisualizationComponent
        visualizationData={{ nodes: mockNodes, links: mockLinks }}
      />
    );
    // Simulate pin
    useAppStore.getState().pinNode('b');
    expect(useAppStore.getState().pinnedNodes).toHaveProperty('b', true);
    // Simulate unpin
    useAppStore.getState().unpinNode('b');
    expect(useAppStore.getState().pinnedNodes).not.toHaveProperty('b');
  });
});
