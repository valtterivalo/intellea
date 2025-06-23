// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen, waitFor, act } from '@testing-library/react';
import VoiceAgentWidget from '@/components/VoiceAgentWidget';

let mockSession: any = null;
vi.mock('@openai/agents/realtime', () => {
  const { EventEmitter } = require('events');
  const tool = (d: any) => d;
  class RealtimeAgent {}
  class RealtimeSession extends EventEmitter {
    transport = new EventEmitter();
    connect = vi.fn();
    close = vi.fn();
    mute = vi.fn();
    constructor() {
      super();
      mockSession = this;
    }
  }
  return { __esModule: true, RealtimeAgent, RealtimeSession, tool };
});

describe('VoiceAgentWidget', () => {
  it('updates history on session events', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: async () => ({ token: 't' }) })) as any;

    render(<VoiceAgentWidget />);
    const fab = screen.getAllByRole('button')[0];
    await act(async () => {
      fireEvent.click(fab);
    });
    await waitFor(() => expect((global.fetch as any)).toHaveBeenCalled());

    // simulate connection and history events
    act(() => {
      mockSession.transport.emit('connection_change', 'connected');
      mockSession.emit('history_added', { type: 'message', role: 'user', content: [{ type: 'input_text', text: 'hi' }] });
      mockSession.emit('history_added', { type: 'message', role: 'assistant', content: [{ type: 'text', text: 'hello' }] });
    });

    expect(await screen.findByText('hi')).toBeInTheDocument();
    expect(await screen.findByText('hello')).toBeInTheDocument();
  });
});
