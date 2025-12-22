'use client';
/**
 * @fileoverview Live preview for the graph web component.
 */

import React, { useEffect, useMemo } from 'react';
import type { GraphResponseV0 } from '@intellea/graph-schema';
import { defineGraphResponseElement } from '@intellea/graph-renderer';

interface WebComponentPreviewProps {
  graphResponse: GraphResponseV0;
}

const WebComponentPreview: React.FC<WebComponentPreviewProps> = ({ graphResponse }) => {
  useEffect(() => {
    defineGraphResponseElement();
  }, []);

  const payload = useMemo(() => JSON.stringify(graphResponse), [graphResponse]);

  return (
    <div className="h-[520px] w-full overflow-hidden rounded-md border bg-background">
      <intellea-graph className="block h-full w-full" data={payload} />
    </div>
  );
};

export default WebComponentPreview;
