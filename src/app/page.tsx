/**
 * @fileoverview Next.js page component.
 * Exports: Home
 */
import React from 'react';
import { createClient } from '@/lib/supabase/server';

import LandingPage from '@/components/LandingPage';
import HomeClient from '@/components/HomeClient';

// Make page component async
export default async function Home() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return <LandingPage allowDemo={true} />;
  }

  return <HomeClient />;
}
