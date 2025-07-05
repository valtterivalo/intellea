'use client';
/**
 * @fileoverview Displays error when OAuth code exchange fails.
 * Exports AuthCodeErrorPage.
 */

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

function AuthCodeErrorContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message');
  const error = searchParams.get('error');
  const nextUrl = searchParams.get('next') || '/';

  const getErrorDetails = () => {
    switch (message) {
      case 'missing_code':
        return {
          title: 'Authentication Link Invalid',
          description: 'The authentication link is missing required information or has expired.',
          suggestion: 'Please try signing in again with a fresh magic link.',
        };
      case 'code_exchange_failed':
        return {
          title: 'Authentication Failed',
          description: error || 'Failed to complete the authentication process.',
          suggestion: 'This could be due to an expired link or a network issue. Please try again.',
        };
      default:
        return {
          title: 'Authentication Error',
          description: error || 'An unexpected error occurred during authentication.',
          suggestion: 'Please try signing in again.',
        };
    }
  };

  const errorDetails = getErrorDetails();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <Card className="w-full max-w-md p-6 text-center">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="h-12 w-12 text-yellow-500" />
        </div>
        
        <h1 className="text-2xl font-bold mb-2">{errorDetails.title}</h1>
        
        <p className="text-muted-foreground mb-4">
          {errorDetails.description}
        </p>
        
        <div className="bg-muted p-3 rounded-lg mb-6 text-sm">
          <p>{errorDetails.suggestion}</p>
        </div>

        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Signing In Again
            </Link>
          </Button>
          
          {nextUrl !== '/' && (
            <Button variant="outline" asChild className="w-full">
              <Link href={nextUrl}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go to Original Page
              </Link>
            </Button>
          )}
        </div>

        {process.env.NEXT_PUBLIC_DEBUG === 'true' && (
          <details className="mt-6 text-left">
            <summary className="text-sm text-muted-foreground cursor-pointer">
              Debug Information
            </summary>
            <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-auto">
              {JSON.stringify({
                message,
                error,
                nextUrl,
                searchParams: Object.fromEntries(searchParams.entries())
              }, null, 2)}
            </pre>
          </details>
        )}
      </Card>
    </div>
  );
}

export default function AuthCodeErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted p-4">
        <Card className="w-full max-w-md p-6 text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-yellow-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Loading...</h1>
        </Card>
      </div>
    }>
      <AuthCodeErrorContent />
    </Suspense>
  );
} 
