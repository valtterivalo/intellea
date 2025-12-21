/**
 * @fileoverview Mode switcher for graph rendering presets.
 * Exports: GraphModeSwitcher
 */

import React from 'react';
import type { GraphModeV0 } from '@intellea/graph-schema';

interface GraphModeSwitcherProps {
  currentMode: GraphModeV0;
  modeOverride: GraphModeV0 | null;
  onModeChange: (mode: GraphModeV0 | null) => void;
}

const modeOptions: Array<{ label: string; value: GraphModeV0 | null }> = [
  { label: 'auto', value: null },
  { label: 'map', value: 'map' },
  { label: 'decision', value: 'decision' },
  { label: 'plan', value: 'plan' },
  { label: 'argument', value: 'argument' },
];

const GraphModeSwitcher: React.FC<GraphModeSwitcherProps> = ({
  currentMode,
  modeOverride,
  onModeChange,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">mode</span>
      {modeOptions.map((option) => {
        const isActive = option.value === modeOverride;
        return (
          <button
            key={option.label}
            type="button"
            onClick={() => onModeChange(option.value)}
            className={`rounded-md border px-2 py-1 text-xs transition ${
              isActive
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}
            aria-pressed={isActive}
          >
            {option.label}
          </button>
        );
      })}
      <span className="text-xs text-muted-foreground">base: {currentMode}</span>
    </div>
  );
};

export default GraphModeSwitcher;
