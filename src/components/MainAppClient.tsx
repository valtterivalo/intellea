'use client'; // Mark as a Client Component
/**
 * @fileoverview React component.
 * Exports: MainAppClient
 */

import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { loadStripe } from '@stripe/stripe-js';
import AppHeader from '@/components/AppHeader';
import GraphView from '@/components/GraphView';
import VoiceAgentWidget from '@/components/VoiceAgentWidget';

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set');
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function MainAppClient() {
  const setError = useAppStore((state) => state.setError);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleSubscribe = async (priceId: string) => {
    setIsCheckoutLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/stripe/create-checkout', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });
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

  // Wrapper for backward compatibility with components expecting no parameters
  const handleSubscribeDefault = async () => {
    // Default to monthly plan
    const defaultPriceId = process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID || 'price_1Rn0F0DNd0v7AIsQEj41DcmU';
    await handleSubscribe(defaultPriceId);
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <AppHeader onShowOnboarding={() => setShowOnboarding(true)} onSubscribe={handleSubscribeDefault} isCheckoutLoading={isCheckoutLoading} />
      <GraphView onSubscribe={handleSubscribeDefault} isCheckoutLoading={isCheckoutLoading} showOnboarding={showOnboarding} setShowOnboarding={setShowOnboarding} />
      <VoiceAgentWidget />
    </div>
  );
}

export { default as AppHeader } from './AppHeader';
export { default as GraphView } from './GraphView';
