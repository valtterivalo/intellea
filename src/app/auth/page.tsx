/**
 * @fileoverview Auth page that shows login/signup options
 * Exports: AuthPage (default)
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AuthComponent from '@/components/AuthComponent';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to home
          </Link>
        </div>
        
        <Card>
          <CardHeader className="text-center">
            <div className="flex mb-4">
              <div className="flex w-full justify-end pr-12 -ml-2">
                <Image
                  src="/intellea-assets/intellea_combined_warm.svg"
                  alt="Intellea"
                  width={160}
                  height={48}
                  className="h-12 w-auto"
                />
              </div>
            </div>
            <CardTitle className="text-2xl">Sign in</CardTitle>
          </CardHeader>
          <CardContent>
            <AuthComponent />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}