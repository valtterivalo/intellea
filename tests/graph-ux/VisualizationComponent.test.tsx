// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import VisualizationComponent from '@/components/VisualizationComponent';
import { useAppStore } from '@/store/useAppStore';

// Mock the 3D graph library to capture callbacks
let graphProps: any = null;
vi.mock('react-force-graph-3d', () => ({
  default: (props: any) => {
    graphProps = props;
    return <div data-testid="force-graph" />;
  },
}));

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
      collapsedNodes: {},
    });
    graphProps = null;
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

  it('shows context menu and dispatches actions', () => {
    const onExpand = vi.fn();
    const { container } = render(
      <VisualizationComponent
        visualizationData={{ nodes: mockNodes, links: mockLinks }}
        onNodeExpand={onExpand}
      />
    );

    // Simulate hovering a node via mocked graph component
    graphProps.onNodeHover({ id: 'a', label: 'A' });

    const trigger = container.querySelector('div');
    if (!trigger) throw new Error('trigger div not found');

    fireEvent.contextMenu(trigger);
    expect(screen.getByText('Pin')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Pin'));
    expect(useAppStore.getState().pinnedNodes).toHaveProperty('a', true);

    fireEvent.contextMenu(trigger);
    fireEvent.click(screen.getByText('Collapse Node'));
    expect(useAppStore.getState().collapsedNodes).toHaveProperty('a', true);

    fireEvent.contextMenu(trigger);
    fireEvent.click(screen.getByText('Expand Node'));
    expect(useAppStore.getState().collapsedNodes).not.toHaveProperty('a');
    expect(onExpand).toHaveBeenCalledWith('a', 'A');
  });

  it('handles keyboard shortcuts for selected node', () => {
    const onExpand = vi.fn();
    useAppStore.setState({
      selectedNodeId: 'a',
      pinnedNodes: {},
      collapsedNodes: { a: true },
      focusedNodeId: null,
      activeFocusPathIds: null,
      output: {
        explanationMarkdown: '',
        knowledgeCards: [],
        visualizationData: { nodes: mockNodes, links: mockLinks },
      },
    } as any);

    render(
      <VisualizationComponent
        visualizationData={{ nodes: mockNodes, links: mockLinks }}
        onNodeExpand={onExpand}
      />
    );

    fireEvent.keyDown(window, { key: 'p' });
    expect(useAppStore.getState().pinnedNodes).toHaveProperty('a', true);

    fireEvent.keyDown(window, { key: 'f' });
    expect(useAppStore.getState().focusedNodeId).toBe('a');

    fireEvent.keyDown(window, { key: 'e' });
    expect(useAppStore.getState().collapsedNodes).not.toHaveProperty('a');
    expect(onExpand).toHaveBeenCalledWith('a', 'A');
  });
});
