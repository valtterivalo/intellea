import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Define a function to create the client component client
export const createClient = () =>
  createClientComponentClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  }); 
