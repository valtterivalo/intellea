'use client';
/**
 * @fileoverview Graph control overlay for zoom, labels, rotation, and clustering.
 * Exports: GraphControlsOverlay
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, RotateCw, Target, Palette } from 'lucide-react';

interface GraphControlsOverlayProps {
  isAutoRotateEnabled: boolean;
  areAllLabelsVisible: boolean;
  isClusterColorEnabled: boolean;
  onToggleAutoRotate: () => void;
  onToggleLabels: () => void;
  onToggleClusterColor: () => void;
  onZoomToFit: () => void;
}

const GraphControlsOverlay: React.FC<GraphControlsOverlayProps> = ({
  isAutoRotateEnabled,
  areAllLabelsVisible,
  isClusterColorEnabled,
  onToggleAutoRotate,
  onToggleLabels,
  onToggleClusterColor,
  onZoomToFit,
}) => {
  return (
    <div className="absolute right-3 bottom-3 z-10 flex flex-wrap gap-2 rounded-md border bg-background/80 p-2 shadow-sm backdrop-blur-sm">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Fit graph to view"
        onClick={onZoomToFit}
      >
        <Target className="h-4 w-4" />
      </Button>
      <Button
        variant={areAllLabelsVisible ? 'secondary' : 'ghost'}
        size="icon"
        aria-pressed={areAllLabelsVisible}
        aria-label={areAllLabelsVisible ? 'Show fewer labels' : 'Show all labels'}
        onClick={onToggleLabels}
      >
        {areAllLabelsVisible ? (
          <Eye className="h-4 w-4" />
        ) : (
          <EyeOff className="h-4 w-4" />
        )}
      </Button>
      <Button
        variant={isAutoRotateEnabled ? 'secondary' : 'ghost'}
        size="icon"
        aria-pressed={isAutoRotateEnabled}
        aria-label={isAutoRotateEnabled ? 'Stop auto-rotate' : 'Start auto-rotate'}
        onClick={onToggleAutoRotate}
      >
        <RotateCw
          className={isAutoRotateEnabled ? 'h-4 w-4 animate-spin' : 'h-4 w-4'}
          style={isAutoRotateEnabled ? { animationDuration: '6s' } : undefined}
        />
      </Button>
      <Button
        variant={isClusterColorEnabled ? 'secondary' : 'ghost'}
        size="icon"
        aria-pressed={isClusterColorEnabled}
        aria-label={isClusterColorEnabled ? 'Use depth colors' : 'Use cluster colors'}
        onClick={onToggleClusterColor}
      >
        <Palette className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default GraphControlsOverlay;
