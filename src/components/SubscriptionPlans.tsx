/**
 * @fileoverview Subscription plan selection component
 * Exports: SubscriptionPlans
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Check, AlertCircle } from 'lucide-react';

interface SubscriptionPlansProps {
  onSubscribe: (priceId: string) => Promise<void>;
  isCheckoutLoading: boolean;
  className?: string;
}

const plans = [
  {
    id: 'monthly',
    priceId: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID || 'price_1Rn0F0DNd0v7AIsQEj41DcmU',
    name: 'Monthly Plan',
    price: '$25',
    period: '/month',
    description: 'Perfect for getting started',
    features: [
      'Unlimited knowledge graphs',
      'Document upload & PDF processing', 
      'Lightning-fast Kimi K2 inference',
      'Premium support',
      'Session sync across devices'
    ],
    popular: false,
  },
  {
    id: 'yearly',
    priceId: process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID || 'price_1Rn0FUDNd0v7AIsQRBdIoF2j',
    name: 'Yearly Plan',
    price: '$200',
    period: '/year',
    savings: 'Save 33%',
    monthlyEquivalent: '~$16.67/month',
    description: 'Best value for committed learners',
    features: [
      'Everything in Monthly Plan',
      '33% cost savings',
      'Priority customer support',
      'Early access to new features',
      'Advanced analytics (coming soon)'
    ],
    popular: true,
  },
];

export default function SubscriptionPlans({ 
  onSubscribe, 
  isCheckoutLoading, 
  className = '' 
}: SubscriptionPlansProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string, planId: string) => {
    setSelectedPlan(planId);
    setError(null);
    
    try {
      await onSubscribe(priceId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Subscription failed';
      setError(errorMessage);
    } finally {
      setSelectedPlan(null);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choose Your Plan</h2>
        <p className="text-muted-foreground">
          Unlock the full power of AI-driven knowledge graph visualization
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`
              relative rounded-lg border p-6 transition-all duration-200
              ${plan.popular 
                ? 'border-primary ring-2 ring-primary/20 shadow-lg scale-105' 
                : 'border-border hover:border-primary/50'
              }
            `}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
            )}

            {plan.savings && (
              <div className="absolute -top-2 -right-2">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs font-medium">
                  {plan.savings}
                </span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                {plan.monthlyEquivalent && (
                  <p className="text-sm text-muted-foreground">
                    {plan.monthlyEquivalent}
                  </p>
                )}
              </div>

              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSubscribe(plan.priceId, plan.id)}
                disabled={isCheckoutLoading}
                className={`w-full ${plan.popular ? 'bg-primary' : ''}`}
                variant={plan.popular ? 'default' : 'outline'}
              >
                {isCheckoutLoading && selectedPlan === plan.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Get Started'
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>All plans include a 7-day money-back guarantee</p>
        <p>Cancel or change your plan anytime</p>
      </div>
    </div>
  );
}