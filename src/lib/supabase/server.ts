import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cookieStore: any = null;
  try {
    cookieStore = cookies();
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
            if (typeof cookieStore.set === 'function') {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
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