'use client';

import React from 'react';
import ChatPanel from '@/components/ChatPanel';
import MainAppClient from '@/components/MainAppClient';
import { useAppStore } from '@/store/useAppStore';

export default function HomeClient() {
  const viewMode = useAppStore(state => state.viewMode);

  return (
    <div className="flex flex-col min-h-screen">
      {viewMode === 'chat' ? <ChatPanel /> : <MainAppClient />}
    </div>
  );
} 