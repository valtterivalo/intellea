import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // cookieStore is now awaited, so it should be the actual store object.
          const allCookies = cookieStore.getAll(); 
          return allCookies;
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // As before, this is likely a no-op for read-only store.
              // If cookieStore had a .set, it would be cookieStore.set(name, value, options)
            })
          } catch (error) {
            // console.warn("Error in setAll for server client (expected for read-only store)", error);
          }
        },
      },
    }
  );
}