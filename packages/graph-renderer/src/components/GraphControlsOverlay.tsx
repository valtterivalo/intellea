'use client';
/**
 * @fileoverview Graph control overlay for zoom, labels, rotation, and clustering.
 * Exports: GraphControlsOverlay
 */

import React from 'react';

const buttonBase =
  'inline-flex h-8 items-center justify-center rounded-md border border-transparent px-2 text-xs font-medium text-foreground/80 transition hover:border-border hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

const buttonActive =
  'border-border bg-background text-foreground shadow-sm';

interface GraphControlsOverlayProps {
  isAutoRotateEnabled: boolean;
  areAllLabelsVisible: boolean;
  isClusterColorEnabled: boolean;
  isPerfModeEnabled: boolean;
  isClusterCollapseEnabled: boolean;
  onToggleAutoRotate: () => void;
  onToggleLabels: () => void;
  onToggleClusterColor: () => void;
  onTogglePerfMode: () => void;
  onToggleClusterCollapse: () => void;
  onZoomToFit: () => void;
}

const GraphControlsOverlay: React.FC<GraphControlsOverlayProps> = ({
  isAutoRotateEnabled,
  areAllLabelsVisible,
  isClusterColorEnabled,
  isPerfModeEnabled,
  isClusterCollapseEnabled,
  onToggleAutoRotate,
  onToggleLabels,
  onToggleClusterColor,
  onTogglePerfMode,
  onToggleClusterCollapse,
  onZoomToFit,
}) => {
  return (
    <div className="absolute right-3 bottom-3 z-10 flex flex-wrap gap-2 rounded-md border bg-background/80 p-2 shadow-sm backdrop-blur-sm">
      <button
        type="button"
        className={buttonBase}
        aria-label="Fit graph to view"
        onClick={onZoomToFit}
      >
        fit
      </button>
      <button
        type="button"
        className={`${buttonBase} ${areAllLabelsVisible ? buttonActive : ''}`}
        aria-pressed={areAllLabelsVisible}
        aria-label={areAllLabelsVisible ? 'Show fewer labels' : 'Show all labels'}
        onClick={onToggleLabels}
      >
        labels
      </button>
      <button
        type="button"
        className={`${buttonBase} ${isAutoRotateEnabled ? buttonActive : ''}`}
        aria-pressed={isAutoRotateEnabled}
        aria-label={isAutoRotateEnabled ? 'Stop auto-rotate' : 'Start auto-rotate'}
        onClick={onToggleAutoRotate}
      >
        {isAutoRotateEnabled ? 'rotate: on' : 'rotate'}
      </button>
      <button
        type="button"
        className={`${buttonBase} ${isClusterColorEnabled ? buttonActive : ''}`}
        aria-pressed={isClusterColorEnabled}
        aria-label={isClusterColorEnabled ? 'Use depth colors' : 'Use cluster colors'}
        onClick={onToggleClusterColor}
      >
        color
      </button>
      <button
        type="button"
        className={`${buttonBase} ${isClusterCollapseEnabled ? buttonActive : ''}`}
        aria-pressed={isClusterCollapseEnabled}
        aria-label={
          isClusterCollapseEnabled ? 'Disable cluster collapse' : 'Enable cluster collapse'
        }
        onClick={onToggleClusterCollapse}
      >
        clusters
      </button>
      <button
        type="button"
        className={`${buttonBase} ${isPerfModeEnabled ? buttonActive : ''}`}
        aria-pressed={isPerfModeEnabled}
        aria-label={isPerfModeEnabled ? 'Disable performance mode' : 'Enable performance mode'}
        onClick={onTogglePerfMode}
      >
        perf
      </button>
    </div>
  );
};

export default GraphControlsOverlay;
