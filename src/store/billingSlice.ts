/**
 * @fileoverview Zustand store slice.
 * Exports: createBillingSlice, interface
 */
import { StateCreator } from 'zustand';
import { SupabaseClient } from '@supabase/supabase-js';

export interface BillingSlice {
  subscriptionStatus: 'active' | 'inactive' | 'trialing' | null;
  isSubscriptionLoading: boolean;
  error: string | null;
  fetchSubscriptionStatus: (supabase: SupabaseClient, userId: string) => Promise<void>;
}

export const createBillingSlice: StateCreator<BillingSlice, [], [], BillingSlice> = (set) => ({
  subscriptionStatus: null,
  isSubscriptionLoading: false,
  error: null,

  fetchSubscriptionStatus: async (supabase, userId) => {
    set({ isSubscriptionLoading: true });
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('subscription_status')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      const status = profile?.subscription_status;
      if (process.env.NEXT_PUBLIC_DEBUG === "true") console.log('Fetched subscription status:', status);

      if (status === 'active' || status === 'trialing') {
        set({ subscriptionStatus: 'active', isSubscriptionLoading: false });
      } else {
        set({ subscriptionStatus: 'inactive', isSubscriptionLoading: false });
      }
    } catch (error: unknown) {
      console.error('Error fetching subscription status:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while checking your subscription.';
      set({
        error: `Failed to fetch subscription status: ${errorMessage}`,
        subscriptionStatus: 'inactive',
        isSubscriptionLoading: false,
      });
    }
  },
});

