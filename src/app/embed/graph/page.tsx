'use client';
/**
 * @fileoverview Iframe embed page for GraphResponseRenderer.
 */

import React, { useEffect, useState } from 'react';
import { GraphResponseRenderer } from '@intellea/graph-renderer';
import type { GraphResponseV0 } from '@intellea/graph-schema';

const parseGraphResponseParam = (rawValue: string | null): GraphResponseV0 | null => {
  if (!rawValue) return null;
  const parsed = JSON.parse(rawValue) as GraphResponseV0;
  if (parsed.version !== 'v0') {
    throw new Error(`Unsupported graph response version: ${parsed.version}`);
  }
  return parsed;
};

type GraphEmbedMessage = {
  type: 'intellea:graph-response';
  payload: GraphResponseV0;
};

const GraphEmbedPage: React.FC = () => {
  const [graphResponse, setGraphResponse] = useState<GraphResponseV0 | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return parseGraphResponseParam(params.get('data'));
  });

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data as GraphEmbedMessage | undefined;
      if (!data || data.type !== 'intellea:graph-response') return;
      if (data.payload.version !== 'v0') {
        throw new Error(`Unsupported graph response version: ${data.payload.version}`);
      }
      setGraphResponse(data.payload);
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0 }}>
      {graphResponse ? (
        <GraphResponseRenderer graphResponse={graphResponse} />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--muted-foreground, #94a3b8)',
            fontSize: '0.9rem',
          }}
        >
          waiting for graph data...
        </div>
      )}
    </div>
  );
};

export default GraphEmbedPage;
