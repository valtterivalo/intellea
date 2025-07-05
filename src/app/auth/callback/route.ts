/**
 * @fileoverview Authentication route or page.
 * Exports: GET
 */
import { NextResponse } from 'next/server'
import { type CookieOptions, createServerClient } from '@supabase/ssr'

import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorCode = searchParams.get('error_code')
  const errorDescription = searchParams.get('error_description')
  
  // Check for errors first
  if (error) {
    console.error('[Auth Callback] Error in URL params:', { error, errorCode, errorDescription });
    const nextUrl = searchParams.get('next') ?? '/';
    return NextResponse.redirect(new URL(`/auth/auth-code-error?message=auth_error&error=${encodeURIComponent(errorDescription || error)}&next=${encodeURIComponent(nextUrl)}`, origin));
  }

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
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Ensure user profile exists
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            subscription_status: null, // Will be set when they subscribe
          }, {
            onConflict: 'id',
            ignoreDuplicates: true
          });

        if (profileError) {
          console.error('[Auth Callback] Error creating user profile:', profileError);
          // Don't fail the auth flow for profile creation errors
        } else {
          console.log('[Auth Callback] Profile ensured for user:', data.user.id);
        }
      } catch (profileError) {
        console.error('[Auth Callback] Unexpected error creating profile:', profileError);
        // Don't fail the auth flow for profile creation errors
      }

      // The cookies are now set on `response` by the `setAll` method via `exchangeCodeForSession`
      return response;
    }
    console.error("[Auth Callback] Error exchanging code for session:", error?.message);
    // If error, redirect to an error page, but still use the response object
    // that might have error-related cookies or headers if Supabase set any.
    // For simplicity, we'll create a new redirect for the error case here.
    return NextResponse.redirect(new URL(`/auth/auth-code-error?message=code_exchange_failed&error=${encodeURIComponent(error?.message || 'Unknown error')}`, origin));
  }

  // If no code, redirect to an error page
  const nextUrl = searchParams.get('next') ?? '/';
  return NextResponse.redirect(new URL(`/auth/auth-code-error?message=missing_code&next=${encodeURIComponent(nextUrl)}`, origin));
} 