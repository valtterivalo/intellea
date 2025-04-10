import React from 'react';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

import AuthComponent from '@/components/AuthComponent';
import MainAppClient from '@/components/MainAppClient'; // We will create this next

// Make page component async
export default async function Home() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();

  // If no session, show the Auth component
  if (!session) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
             <h1 className="text-4xl font-bold mb-6">Welcome to Intellea</h1>
            <p className="text-lg text-muted-foreground mb-8">Please sign in to continue</p>
            <AuthComponent />
        </div>
    );
  }

  // If session exists, render the main app (via a client component wrapper)
  return <MainAppClient />;
}
