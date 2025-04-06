import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    try {
        await supabase.auth.exchangeCodeForSession(code)
    } catch (error) {
        console.error("Error exchanging code for session:", error);
        // Handle the error appropriately - maybe redirect to an error page
        return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_error`);
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin)
} 