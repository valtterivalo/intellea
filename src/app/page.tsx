import React from 'react';
// No longer needed: import { cookies } from 'next/headers';
// No longer needed: import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@/lib/supabase/server'; // Import the new server client utility

import AuthComponent from '@/components/AuthComponent';
import MainAppClient from '@/components/MainAppClient'; // We will create this next

// Make page component async
export default async function Home() {
  // No longer need to get cookieStore manually here
  // const cookieStore = cookies();
  // Pass a function that returns the pre-fetched cookie store
  // const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const supabase = await createClient(); // Use the new utility, it handles cookies internally
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

  // If session exists, render the main app (via a client component wrapper)
  return <MainAppClient />;
}
