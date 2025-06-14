// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import ChatPanel from '@/components/ChatPanel';
import { useAppStore } from '@/store/useAppStore';

describe('ChatPanel', () => {
  it('renders and sends through slice', async () => {
    const send = vi.fn(async (text: string) => {
      useAppStore.setState((s) => ({ messages: [...s.messages, { role: 'user', content: text }, { role: 'assistant', content: 'pong' }] }));
    });
    useAppStore.setState({ messages: [], send } as any);

    render(<ChatPanel />);
    const box = screen.getByRole('textbox');
    fireEvent.change(box, { target: { value: 'ping' } });
    fireEvent.keyDown(box, { key: 'Enter' });

    await waitFor(() => expect(send).toHaveBeenCalled());
    expect(screen.getByText('pong')).toBeInTheDocument();
  });
});
