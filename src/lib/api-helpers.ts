import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';

interface UserAccessResult {
    user: User | null;
    error: NextResponse | null;
}

/**
 * Verifies that a user is authenticated and has an active subscription.
 * To be used in server-side API routes.
 * @returns {Promise<UserAccessResult>} An object containing the user on success, or an error response on failure.
 */
export async function verifyUserAccess(): Promise<UserAccessResult> {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        console.error("Authentication error:", authError?.message || "No user found");
        return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_status')
        .eq('id', user.id)
        .single();

    if (profileError) {
        console.error("Profile fetch error:", profileError.message);
        return { user: null, error: NextResponse.json({ error: 'Error fetching subscription status' }, { status: 500 }) };
    }

    if (profile?.subscription_status !== 'active' && profile?.subscription_status !== 'trialing') {
        return { user: null, error: NextResponse.json({ error: 'Active subscription required' }, { status: 402 }) };
    }

    return { user, error: null };
} 