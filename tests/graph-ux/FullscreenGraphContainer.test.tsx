import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import FullscreenGraphContainer from '@/components/FullscreenGraphContainer';
import { useAppStore } from '@/store/useAppStore';

const cameraPositionMock = vi.fn();

vi.mock('@/components/VisualizationComponent', () => {
  const React = require('react');
  const comp = React.forwardRef((props: any, ref) => {
    React.useImperativeHandle(ref, () => ({
      camera: () => ({ position: { x: 0, y: 0, z: 800 }, zoom: 1 }),
      cameraPosition: cameraPositionMock,
      controls: () => ({ addEventListener: () => {}, removeEventListener: () => {} })
    }));
    return <div data-testid="mock-graph" />;
  });
  return { __esModule: true, default: comp };
});

vi.mock('@/components/MiniMap', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: (props: any) => (
      <div data-testid="mini-map" onClick={() => props.onCenter(1,2)} />
    )
  };
});

const mockOutput = {
  explanationMarkdown: null,
  knowledgeCards: null,
  visualizationData: { nodes: [{ id: 'a', label: 'A' }], links: [] }
};

describe('FullscreenGraphContainer mini map', () => {
  beforeEach(() => {
    useAppStore.setState({ output: mockOutput, isGraphFullscreen: true });
    cameraPositionMock.mockClear();
  });

  it('toggles mini map visibility', () => {
    render(<FullscreenGraphContainer onNodeExpand={() => {}} expandingNodeId={null} />);
    const toggle = screen.getByLabelText('Toggle mini map');
    expect(screen.getByTestId('mini-map')).toBeInTheDocument();
    fireEvent.click(toggle);
    expect(screen.queryByTestId('mini-map')).toBeNull();
  });

  it('recenters graph on mini map click', () => {
    render(<FullscreenGraphContainer onNodeExpand={() => {}} expandingNodeId={null} />);
    const mini = screen.getByTestId('mini-map');
    fireEvent.click(mini);
    expect(cameraPositionMock).toHaveBeenCalled();
  });
});
