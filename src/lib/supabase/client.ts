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
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
