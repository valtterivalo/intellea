/**
 * @fileoverview Next.js page component.
 * Exports: Home
 */
import React from 'react';
// No longer needed: import { cookies } from 'next/headers';
// No longer needed: import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@/lib/supabase/server'; // Import the new server client utility

import LandingPage from '@/components/LandingPage';
import HomeClient from '@/components/HomeClient';

// Make page component async
export default async function Home() {
  // No longer need to get cookieStore manually here
  // const cookieStore = cookies();
  // Pass a function that returns the pre-fetched cookie store
  // const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const supabase = await createClient(); // Use the new utility, it handles cookies internally
  const { data: { user }, error } = await supabase.auth.getUser(); // Use getUser() and expect { user }

  // If error or no user, show the landing page with demo option
  if (error || !user) {
    return <LandingPage allowDemo={true} />;
  }

  // If session exists, render the client wrapper
  return <HomeClient />;
}
