import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import SearchNodes from '@/components/SearchNodes';
import { useAppStore, IntelleaResponse } from '@/store/useAppStore';

const mockOutput: IntelleaResponse = {
  explanationMarkdown: null,
  knowledgeCards: [],
  visualizationData: {
    nodes: [
      { id: '1', label: 'Alpha' },
      { id: '2', label: 'Beta' },
      { id: '3', label: 'Gamma' },
    ],
    links: [],
  },
};

describe('SearchNodes component', () => {
  beforeEach(() => {
    useAppStore.setState({
      output: mockOutput,
      selectedNodeId: null,
      focusedNodeId: null,
      activeFocusPathIds: null,
    });
  });

  it('filters suggestions based on input', () => {
    render(<SearchNodes />);
    const input = screen.getByPlaceholderText('Search nodes...');
    fireEvent.change(input, { target: { value: 'a' } });
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.queryByText('Beta')).toBeNull();
  });

  it('updates focus and selection on choose', () => {
    render(<SearchNodes />);
    const input = screen.getByPlaceholderText('Search nodes...');
    fireEvent.change(input, { target: { value: 'ga' } });
    fireEvent.mouseDown(screen.getByText('Gamma'));
    expect(useAppStore.getState().selectedNodeId).toBe('3');
    expect(useAppStore.getState().focusedNodeId).toBe('3');
    expect(useAppStore.getState().activeFocusPathIds?.has('3')).toBe(true);
  });
});
