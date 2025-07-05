'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { loadStripe } from '@stripe/stripe-js';
import AppHeader from '@/components/AppHeader';
import GraphView from '@/components/GraphView';
import PromptFooter from '@/components/PromptFooter';
import VoiceAgentWidget from '@/components/VoiceAgentWidget';

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set');
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function MainAppClient() {
  const setError = useAppStore((state) => state.setError);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleSubscribe = async () => {
    setIsCheckoutLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/stripe/create-checkout', { method: 'POST' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create checkout session');
      }
      const { sessionId } = await response.json();
      if (!sessionId) throw new Error('Missing session ID from checkout response');
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe.js failed to load');
      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) throw error;
    } catch (err) {
      console.error('Subscribe error:', err);
      setError(`Subscription failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <AppHeader onShowOnboarding={() => setShowOnboarding(true)} onSubscribe={handleSubscribe} isCheckoutLoading={isCheckoutLoading} />
      <GraphView onSubscribe={handleSubscribe} isCheckoutLoading={isCheckoutLoading} showOnboarding={showOnboarding} setShowOnboarding={setShowOnboarding} />
      <PromptFooter />
      <VoiceAgentWidget />
    </div>
  );
}

export { default as AppHeader } from './AppHeader';
export { default as GraphView } from './GraphView';
export { default as PromptFooter } from './PromptFooter';
