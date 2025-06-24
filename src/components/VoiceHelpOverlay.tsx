'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface VoiceHelpOverlayProps {
  open: boolean;
  onClose: () => void;
}

const VoiceHelpOverlay: React.FC<VoiceHelpOverlayProps> = ({ open, onClose }) => {
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
        <h2 className="text-xl font-semibold mb-2">Voice Controls</h2>
        <p className="text-sm mb-3 text-muted-foreground">You can control the voice assistant with these shortcuts:</p>
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li><span className="font-mono">Ctrl+Shift+V</span> - Connect or disconnect voice assistant</li>
          <li><span className="font-mono">Ctrl+M</span> - Mute or unmute microphone</li>
        </ul>
        <Button onClick={onClose} className="w-full mt-4">Got it</Button>
      </div>
    </div>
  );
};

export default VoiceHelpOverlay;
