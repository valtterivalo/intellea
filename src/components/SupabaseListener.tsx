'use client'
/**
 * @fileoverview React component.
 * Exports: SupabaseListener
 */

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client' // Use our browser client creator

export default function SupabaseListener({ serverAccessToken }: { serverAccessToken?: string }) {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.access_token !== serverAccessToken) {
        // Server and client session mismatch. Refresh the page
        router.refresh();
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [serverAccessToken, router, supabase])

  return null // This component doesn't render anything
} 