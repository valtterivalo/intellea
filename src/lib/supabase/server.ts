/**
 * @fileoverview Supabase helper.
 * Exports: createClient
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * @description Create a Supabase client for server environments.
 * Handles cookie management gracefully outside of request contexts.
 * @returns Supabase server client instance.
 */
export function createClient() {
  interface CookieStore {
    getAll(): { name: string; value: string }[];
    set?: (name: string, value: string, options?: CookieOptions) => void;
  }
  
  let cookieStore: CookieStore;
  try {
    cookieStore = cookies() as unknown as CookieStore;
  } catch {
    // outside of a request context, cookies() throws. Provide a dummy store so
    // tests and non-request code can still instantiate the client safely.
    cookieStore = {
      getAll() {
        return [] as { name: string; value: string }[];
      },
      set() {
        /* noop */
      },
    };
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            // only call set if the underlying cookie store supports it
            if (cookieStore.set && typeof cookieStore.set === 'function') {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set!(name, value, options);
              });
            }
          } catch {
            // ignore errors from attempting to set cookies on read-only store
          }
        },
      },
    }
  );
}