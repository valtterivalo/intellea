'use client';
/**
 * @fileoverview Live preview for iframe embed integration.
 */

import React, { useCallback, useRef } from 'react';
import type { GraphResponseV0 } from '@intellea/graph-schema';

interface IframePreviewProps {
  graphResponse: GraphResponseV0;
  src?: string;
}

const IframePreview: React.FC<IframePreviewProps> = ({
  graphResponse,
  src = '/embed/graph',
}) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const postPayload = useCallback(() => {
    const frame = iframeRef.current;
    if (!frame?.contentWindow) return;
    frame.contentWindow.postMessage(
      { type: 'intellea:graph-response', payload: graphResponse },
      '*'
    );
  }, [graphResponse]);

  return (
    <div className="h-[520px] w-full overflow-hidden rounded-md border bg-background">
      <iframe
        ref={iframeRef}
        className="h-full w-full border-0"
        title="graph embed preview"
        src={src}
        onLoad={postPayload}
      />
    </div>
  );
};

export default IframePreview;
