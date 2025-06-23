import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, screen, act } from '@testing-library/react';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useAppStore } from '@/store/useAppStore';

const mockOutput = {
  explanationMarkdown: '',
  knowledgeCards: [],
  visualizationData: {
    nodes: [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' }
    ],
    links: []
  }
};

describe('Breadcrumbs component', () => {
  beforeEach(() => {
    useAppStore.setState({
      visitedNodeIds: [],
      selectedNodeId: null,
      pinnedNodes: {},
      output: mockOutput as any
    });
  });

  it('renders visited nodes and handles click', () => {
    const setSelected = vi.spyOn(useAppStore.getState(), 'setSelectedNodeId');
    const setFocus = vi.spyOn(useAppStore.getState(), 'setActiveFocusPath');

    act(() => {
      useAppStore.getState().setSelectedNodeId('a');
      useAppStore.getState().setSelectedNodeId('b');
    });

    render(<Breadcrumbs />);
    const first = screen.getByText('A');
    act(() => {
      fireEvent.click(first);
    });
    expect(setSelected).toHaveBeenCalledWith('a');
    expect(setFocus).toHaveBeenCalled();
    expect(screen.getAllByRole('button').length).toBe(2);
  });
});
