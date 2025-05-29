import { StateCreator } from 'zustand';
import { SupabaseClient } from '@supabase/supabase-js';

export interface BillingSlice {
  subscriptionStatus: 'active' | 'inactive' | 'trialing' | null;
  isSubscriptionLoading: boolean;
  fetchSubscriptionStatus: (supabase: SupabaseClient, userId: string) => Promise<void>;
}

export const createBillingSlice: StateCreator<BillingSlice, [], [], BillingSlice> = (set, get) => ({
  subscriptionStatus: null,
  isSubscriptionLoading: false,

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
      console.log('Fetched subscription status:', status);

      if (status === 'active' || status === 'trialing') {
        set({ subscriptionStatus: 'active', isSubscriptionLoading: false });
      } else {
        set({ subscriptionStatus: 'inactive', isSubscriptionLoading: false });
      }
    } catch (error: any) {
      console.error('Error fetching subscription status:', error);
      const errorMessage = error?.message ? error.message : 'An unexpected error occurred while checking your subscription.';
      set({
        error: `Failed to fetch subscription status: ${errorMessage}`,
        subscriptionStatus: 'inactive',
        isSubscriptionLoading: false,
      } as any);
    }
  },
});

