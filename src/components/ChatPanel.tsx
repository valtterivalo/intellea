'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useAppStore, ChatMessage } from '@/store/useAppStore';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export default function ChatPanel() {
  const messages = useAppStore(state => state.messages);
  const send = useAppStore(state => state.send);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    send(input);
    setInput('');
  };

  return (
    <div className="flex flex-col min-h-[60vh] max-w-4xl mx-auto w-full p-4">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 mb-2 border rounded p-2 bg-background">
        {messages.map((m: ChatMessage, idx: number) => (
          <div key={idx} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <span className={m.role === 'user' ? 'bg-primary text-primary-foreground inline-block rounded px-2 py-1' : 'bg-muted inline-block rounded px-2 py-1'}>
              {m.content}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Textarea
          placeholder="Say something..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 resize-none"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button onClick={handleSend}>Send</Button>
      </div>
    </div>
  );
}
