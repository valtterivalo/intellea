/**
 * @fileoverview Library utilities.
 * Exports: ensureUserProfile, verifyUserAccess
 */
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { checkDemoRateLimit } from './demo-rate-limit';

interface UserAccessResult {
    user: User | null;
    error: NextResponse | null;
}

interface DemoUserAccessResult {
    user: User | null;
    error: NextResponse | null;
    isDemo: boolean;
}

/**
 * @description Ensure that a user profile row exists.
 * @param userId - Supabase user ID.
 * @returns `true` if the profile exists or was created.
 */
export async function ensureUserProfile(userId: string): Promise<boolean> {
    const supabase = await createClient();
    
    try {
        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                subscription_status: null,
            }, {
                onConflict: 'id',
                ignoreDuplicates: true
            });

        if (error) {
            console.error("Error ensuring user profile:", error);
            return false;
        }
        return true;
    } catch (error) {
        console.error("Unexpected error ensuring user profile:", error);
        return false;
    }
}

/**
 * @description Verify that the user is authenticated and subscribed.
 * @returns Object containing the user or an error response.
 */
export async function verifyUserAccess(): Promise<UserAccessResult> {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        console.error("Authentication error:", authError?.message || "No user found");
        return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }

    // Ensure profile exists
    await ensureUserProfile(user.id);

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

/**
 * @description Verify user access with support for demo mode.
 * @param isDemo - Whether this is a demo request.
 * @param req - Request object for rate limiting (required for demo mode).
 * @returns Object containing the user, error, and demo status.
 */
export async function verifyUserAccessWithDemo(isDemo: boolean = false, req?: NextRequest): Promise<DemoUserAccessResult> {
    // For demo mode, check rate limiting
    if (isDemo) {
        if (!req) {
            return { user: null, error: NextResponse.json({ error: 'Internal error: Request required for demo mode' }, { status: 500 }), isDemo: true };
        }
        
        const isRateLimited = await checkDemoRateLimit(req);
        if (isRateLimited) {
            return { user: null, error: NextResponse.json({ error: 'Demo limit reached. Please try again in 1 hour or sign up for unlimited access.' }, { status: 429 }), isDemo: true };
        }
        
        return { user: null, error: null, isDemo: true };
    }

    // For non-demo mode, use regular verification
    const { user, error } = await verifyUserAccess();
    return { user, error, isDemo: false };
} 