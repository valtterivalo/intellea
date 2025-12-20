/**
 * @fileoverview Supabase helper.
 * Exports: createClient
 */
import { createBrowserClient } from '@supabase/ssr'

// Define a function to create the client component client
/**
 * @description Create a Supabase client for browser usage.
 * @returns Supabase browser client instance.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    const isBuild = typeof window === 'undefined' && process.env.NEXT_PHASE === 'phase-production-build'
    if (!isBuild) {
      throw new Error('Supabase environment variables are not set')
    }
    return createBrowserClient('http://localhost', 'build-placeholder-key')
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
