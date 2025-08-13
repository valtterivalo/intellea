/**
 * @fileoverview Landing page for unauthenticated users
 * Exports: LandingPage
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Upload, Eye, Network } from 'lucide-react';
import { useRouter } from 'next/navigation';
import NewSessionPrompt from './NewSessionPrompt';
import Image from 'next/image';

interface LandingPageProps {
  allowDemo?: boolean;
}

const LandingPage: React.FC<LandingPageProps> = ({ allowDemo = false }) => {
  const router = useRouter();
  const [showDemo, setShowDemo] = useState(false);

  const handleAuth = () => {
    router.push('/auth');
  };

  const handleTryDemo = () => {
    setShowDemo(true);
  };

  if (showDemo) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image
                src="/intellea-assets/intellea_wordmark_warm.svg"
                alt="Intellea"
                width={120}
                height={32}
                className="h-8 w-auto"
              />
              <span className="text-sm text-muted-foreground">Demo</span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => setShowDemo(false)}>
                Back
              </Button>
              <Button onClick={handleAuth}>
                Sign Up
              </Button>
            </div>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-6">
          <NewSessionPrompt isDemo={true} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Image
              src="/intellea-assets/intellea_wordmark_warm.svg"
              alt="Intellea"
              width={120}
              height={32}
              className="h-8 w-auto"
            />
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={handleAuth}>
              Sign In
            </Button>
            <Button onClick={handleAuth}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6">
        <div className="py-20 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
            A more intuitive way to learn and research
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Upload documents, ask questions, and explore topics through interactive knowledge graphs 
            instead of endless chat threads.
          </p>
          
          <div className="flex items-center justify-center gap-4 mb-12">
            <Button size="lg" onClick={handleAuth}>
              Start Exploring
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            {allowDemo && (
              <Button variant="outline" size="lg" onClick={handleTryDemo}>
                Try Demo
              </Button>
            )}
          </div>

          {/* Demo Iframe Placeholder */}
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-8">
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Network className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Interactive demo coming soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features */}
        <div className="py-16">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-6 text-center">
                <Network className="h-8 w-8 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">See connections</h3>
                <p className="text-sm text-muted-foreground">
                  Topics link together naturally
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <Eye className="h-8 w-8 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">Explore visually</h3>
                <p className="text-sm text-muted-foreground">
                  Navigate ideas in 3D space
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <Upload className="h-8 w-8 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">Upload anything</h3>
                <p className="text-sm text-muted-foreground">
                  PDFs, research papers, documents
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Simple CTA */}
        <div className="py-16 text-center border-t">
          <h2 className="text-2xl font-semibold mb-4">Ready to explore?</h2>
          <Button size="lg" onClick={handleAuth}>
            Get Started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 Intellea. Built for researchers and learners.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;