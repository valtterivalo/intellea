'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/useAppStore';

const OnboardingModal: React.FC = () => {
  const dismissed = useAppStore((state) => state.onboardingDismissed);
  const setDismissed = useAppStore((state) => state.setOnboardingDismissed);

  if (dismissed) return null;

  const handleDismiss = () => setDismissed(true);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Welcome to Intellea</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="mb-2">Here's a quick guide to get started:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Press <kbd className="border px-1 rounded">Enter</kbd> to send a prompt (use
              <kbd className="border px-1 mx-1 rounded">Shift</kbd>+
              <kbd className="border px-1 rounded">Enter</kbd> for a new line).
            </li>
            <li>Double-click nodes to expand concepts.</li>
            <li>Right-click nodes to pin or unpin them.</li>
            <li>Press <kbd className="border px-1 rounded">Esc</kbd> to close fullscreen or concept views.</li>
          </ul>
          <div className="text-center pt-4">
            <Button onClick={handleDismiss}>Got it!</Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default OnboardingModal;
