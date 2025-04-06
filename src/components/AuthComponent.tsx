'use client';

import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClient } from '@/lib/supabase/client'; // Import our client creator

const AuthComponent = () => {
  const supabase = createClient(); // Create the Supabase client instance

  return (
    <div className="w-full max-w-md mx-auto mt-8 p-4">
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }} // Basic Supabase theme
        providers={['google', 'github']} // Add Google and GitHub to the providers list
        view="magic_link" // Start with magic link view
        showLinks={true} // Show links to switch between magic link / social
        redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`} // URL to redirect to after successful login
      />
    </div>
  );
};

export default AuthComponent; 