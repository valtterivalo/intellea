'use client';

import React from 'react';
import ChatPanel from '@/components/ChatPanel';
import MainAppClient from '@/components/MainAppClient';

export default function HomeClient() {
  const [viewMode, setViewMode] = React.useState<'graph' | 'chat'>('graph');

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b p-2 flex gap-2">
        <button
          onClick={() => setViewMode('graph')}
          className={`px-2 py-1 rounded ${viewMode === 'graph' ? 'bg-primary text-primary-foreground' : ''}`}
        >
          graph
        </button>
        <button
          onClick={() => setViewMode('chat')}
          className={`px-2 py-1 rounded ${viewMode === 'chat' ? 'bg-primary text-primary-foreground' : ''}`}
        >
          chat
        </button>
      </header>
      {viewMode === 'chat' ? <ChatPanel /> : <MainAppClient />}
    </div>
  );
} 