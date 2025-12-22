'use client';
/**
 * @fileoverview Live preview for the React renderer.
 */

import React from 'react';
import type { GraphResponseV0 } from '@intellea/graph-schema';
import { GraphResponseRenderer } from '@intellea/graph-renderer';

interface GraphRendererPreviewProps {
  graphResponse: GraphResponseV0;
}

const GraphRendererPreview: React.FC<GraphRendererPreviewProps> = ({ graphResponse }) => {
  return (
    <div className="h-[520px] w-full overflow-hidden rounded-md border bg-background">
      <GraphResponseRenderer graphResponse={graphResponse} showPerfOverlay={false} />
    </div>
  );
};

export default GraphRendererPreview;
