import { NextResponse } from 'next/server'
import { type CookieOptions, createServerClient } from '@supabase/ssr'

import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // const next = searchParams.get('next') ?? '/' // We'll handle 'next' after successful exchange

  if (code) {
    // Create a NextRequest from the incoming request to be able to read cookies
    // (though request.cookies can be used directly)
    // And a NextResponse to be able to set cookies
    const response = NextResponse.redirect(new URL(searchParams.get('next') ?? '/', origin));

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                response.cookies.set(name, value, options)
              })
            } catch (error) {
              // Log error, but don't crash request
              console.error('[Auth Callback] Error in setAll trying to set cookies on NextResponse:', error)
            }
          },
        },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // The cookies are now set on `response` by the `setAll` method via `exchangeCodeForSession`
      return response;
    }
    console.error("[Auth Callback] Error exchanging code for session:", error.message);
    // If error, redirect to an error page, but still use the response object
    // that might have error-related cookies or headers if Supabase set any.
    // For simplicity, we'll create a new redirect for the error case here.
    return NextResponse.redirect(new URL(`/auth/auth-code-error?message=code_exchange_failed&error=${error.message}`, origin));
  }

  // If no code, redirect to an error page
  const nextUrl = searchParams.get('next') ?? '/';
  return NextResponse.redirect(new URL(`/auth/auth-code-error?message=missing_code&next=${encodeURIComponent(nextUrl)}`, origin));
} 