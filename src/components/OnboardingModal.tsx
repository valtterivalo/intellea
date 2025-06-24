'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ open, onClose }) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = 'auto';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="bg-card rounded-lg shadow-xl border w-96 p-6 relative">
        <h2 className="text-xl font-semibold mb-2">Welcome to Intellea</h2>
        <p className="text-sm mb-3 text-muted-foreground">Useful keyboard shortcuts:</p>
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li><span className="font-mono">F</span> - Focus selected node</li>
          <li><span className="font-mono">P</span> - Pin or unpin selected node</li>
          <li><span className="font-mono">E</span> - Expand selected node</li>
          <li><span className="font-mono">Space</span> - Push to talk</li>
        </ul>
        <Separator className="my-4" />
        <Button onClick={onClose} className="w-full">Got it</Button>
      </div>
    </div>
  );
};

export default OnboardingModal;
