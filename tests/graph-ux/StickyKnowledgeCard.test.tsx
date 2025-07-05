import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, screen, act } from '@testing-library/react';
import StickyKnowledgeCard from '@/components/StickyKnowledgeCard';
import { useAppStore } from '@/store/useAppStore';

const output = {
  explanationMarkdown: null,
  knowledgeCards: [{ nodeId: '1', title: 'Title', description: 'Desc' }],
  visualizationData: { nodes: [], links: [] }
};

describe('StickyKnowledgeCard', () => {
  let knowledgeRef: React.RefObject<HTMLDivElement>;
  let scrollRef: React.RefObject<HTMLDivElement>;
  let cardRectSpy: any;

  beforeEach(() => {
    knowledgeRef = { current: document.createElement('div') } as any;
    scrollRef = { current: document.createElement('div') } as any;
    cardRectSpy = vi.spyOn(knowledgeRef.current!, 'getBoundingClientRect').mockReturnValue({ bottom: 0 } as any);
    vi.spyOn(scrollRef.current!, 'getBoundingClientRect').mockReturnValue({ top: 200 } as any);
    (scrollRef.current as any).querySelector = vi.fn(() => null);
    useAppStore.setState({ activeClickedNodeId: '1', output });
  });

  it('minimizes and restores the card', () => {
    render(<StickyKnowledgeCard knowledgeCardsRef={knowledgeRef} scrollContainerRef={scrollRef} />);

    const minimize = screen.getByLabelText('Minimize');
    fireEvent.click(minimize);

    expect(screen.queryByLabelText('Minimize')).toBeNull();
    expect(screen.queryByText('Title')).toBeNull();

    fireEvent.click(screen.getByText('Focused Concept'));

    expect(screen.getByLabelText('Minimize')).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
  });

  it('resets when sticky state is lost', () => {
    const { rerender } = render(
      <StickyKnowledgeCard knowledgeCardsRef={knowledgeRef} scrollContainerRef={scrollRef} />
    );

    fireEvent.click(screen.getByLabelText('Minimize'));
    expect(screen.queryByText('Title')).toBeNull();

    // make element visible again so sticky becomes false
    let bottom = 400;
    act(() => {
      cardRectSpy.mockImplementation(() => ({ bottom } as any));
      fireEvent.scroll(scrollRef.current!);
    });

    rerender(<StickyKnowledgeCard knowledgeCardsRef={knowledgeRef} scrollContainerRef={scrollRef} />);
    expect(screen.queryByLabelText('Minimize')).toBeNull();

    // revert to sticky state
    bottom = 0;
    act(() => {
      fireEvent.scroll(scrollRef.current!);
    });
    rerender(<StickyKnowledgeCard knowledgeCardsRef={knowledgeRef} scrollContainerRef={scrollRef} />);

    expect(screen.getByLabelText('Minimize')).toBeInTheDocument();
  });
});
