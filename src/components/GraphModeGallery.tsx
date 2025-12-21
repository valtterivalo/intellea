/**
 * @fileoverview Gallery rendering the current graph in multiple modes.
 * Exports: GraphModeGallery
 */

import React, { useMemo, useState } from 'react';
import { GraphResponseRenderer } from '@intellea/graph-renderer';
import type { GraphModeV0, GraphResponseV0 } from '@intellea/graph-schema';
import { Button } from '@/components/ui/button';
import { buildModeVariants } from '@/lib/graphModes';

interface GraphModeGalleryProps {
  graphResponse: GraphResponseV0;
  activeMode: GraphModeV0;
  onSelectMode: (mode: GraphModeV0) => void;
}

const GraphModeGallery: React.FC<GraphModeGalleryProps> = ({
  graphResponse,
  activeMode,
  onSelectMode,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const variants = useMemo(() => buildModeVariants(graphResponse, 'low'), [graphResponse]);

  return (
    <section className="mt-6 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">mode gallery</h3>
          <p className="text-xs text-muted-foreground">
            same graph, different emphasis presets
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          {isOpen ? 'hide modes' : 'compare modes'}
        </Button>
      </div>
      {isOpen && (
        <div className="grid gap-4 md:grid-cols-2">
          {variants.map(({ mode, response }) => {
            const isActive = mode === activeMode;
            return (
              <div key={mode} className="rounded-md border bg-card shadow-sm">
                <div className="flex items-center justify-between border-b px-3 py-2">
                  <span className="text-sm font-medium capitalize">{mode}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant={isActive ? 'secondary' : 'ghost'}
                    onClick={() => onSelectMode(mode)}
                  >
                    {isActive ? 'active' : 'use'}
                  </Button>
                </div>
                <div className="relative h-64">
                  <div className="absolute inset-0 pointer-events-none">
                    <GraphResponseRenderer
                      graphResponse={response}
                      showControls={false}
                      showPerfOverlay={false}
                      disableFocusEffects
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default GraphModeGallery;
