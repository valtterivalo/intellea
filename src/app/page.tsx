import React from 'react';
// No longer needed: import { cookies } from 'next/headers';
// No longer needed: import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@/lib/supabase/server'; // Import the new server client utility

import AuthComponent from '@/components/AuthComponent';
import MainAppClient from '@/components/MainAppClient';
import ChatPanel from '@/components/ChatPanel';

// Make page component async
export default async function Home() {
  // No longer need to get cookieStore manually here
  // const cookieStore = cookies();
  // Pass a function that returns the pre-fetched cookie store
  // const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const supabase = createClient(); // Use the new utility, it handles cookies internally
  const { data: { user }, error } = await supabase.auth.getUser(); // Use getUser() and expect { user }

  // If error or no user, show the Auth component
  if (error || !user) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
             <h1 className="text-4xl font-bold mb-6">Welcome to Intellea</h1>
            <p className="text-lg text-muted-foreground mb-8">Please sign in to continue</p>
            <AuthComponent />
        </div>
    );
  }

  // If session exists, render the client wrapper
  return <HomeClient />;
}

function HomeClient() {
  'use client';
  const [viewMode, setViewMode] = React.useState<'graph' | 'chat'>('graph');

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b p-2 flex gap-2">
        <button
          onClick={() => setViewMode('graph')}
          className={`px-2 py-1 rounded ${viewMode === 'graph' ? 'bg-primary text-primary-foreground' : ''}`}
        >
          Graph
        </button>
        <button
          onClick={() => setViewMode('chat')}
          className={`px-2 py-1 rounded ${viewMode === 'chat' ? 'bg-primary text-primary-foreground' : ''}`}
        >
          Chat
        </button>
      </header>
      {viewMode === 'chat' ? <ChatPanel /> : <MainAppClient />}
    </div>
  );
}
