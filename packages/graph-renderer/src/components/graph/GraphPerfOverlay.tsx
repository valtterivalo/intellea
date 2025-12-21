'use client';
/**
 * @fileoverview Performance stats overlay for the graph view.
 * Exports: GraphPerfOverlay
 */

import React from 'react';

interface GraphPerfOverlayProps {
  renderFps: number | null;
  simFps: number | null;
  fullCounts: { nodes: number; links: number };
  visibleCounts: { nodes: number; links: number };
  renderCounts: { nodes: number; links: number };
  phase: 'core' | 'full';
  labelCount: number | null;
  isSimDisabled: boolean;
  isPointerEnabled: boolean;
}

const GraphPerfOverlay: React.FC<GraphPerfOverlayProps> = ({
  renderFps,
  simFps,
  fullCounts,
  visibleCounts,
  renderCounts,
  phase,
  labelCount,
  isSimDisabled,
  isPointerEnabled,
}) => {
  return (
    <div className="absolute left-3 top-3 z-10 rounded-md border bg-background/80 px-3 py-2 text-xs text-foreground shadow-sm backdrop-blur-sm">
      <div className="font-medium">perf</div>
      <div>fps (render): {renderFps ?? '—'}</div>
      <div>fps (sim): {simFps ?? '—'}</div>
      <div>
        full: {fullCounts.nodes} / {fullCounts.links}
      </div>
      <div>
        visible: {visibleCounts.nodes} / {visibleCounts.links}
      </div>
      <div>
        render: {renderCounts.nodes} / {renderCounts.links}
      </div>
      <div>phase: {phase}</div>
      <div>labels: {labelCount ?? 'all'}</div>
      <div>sim: {isSimDisabled ? 'disabled' : 'active'}</div>
      <div>pointer: {isPointerEnabled ? 'on' : 'off'}</div>
    </div>
  );
};

export default GraphPerfOverlay;
