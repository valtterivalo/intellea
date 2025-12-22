'use client';
/**
 * @fileoverview Iframe embed page for GraphResponseRenderer.
 */

import React, { useEffect, useState } from 'react';
import { GraphResponseRenderer } from '@intellea/graph-renderer';
import type { GraphResponseV0 } from '@intellea/graph-schema';
import { sampleGraphResponse } from './samplePayload';

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
  const [graphResponse, setGraphResponse] = useState<GraphResponseV0>(() => {
    if (typeof window === 'undefined') return sampleGraphResponse;
    const params = new URLSearchParams(window.location.search);
    return parseGraphResponseParam(params.get('data')) ?? sampleGraphResponse;
  });
  const [isDemo, setIsDemo] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const params = new URLSearchParams(window.location.search);
    return !params.get('data');
  });

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data as GraphEmbedMessage | undefined;
      if (!data || data.type !== 'intellea:graph-response') return;
      if (data.payload.version !== 'v0') {
        throw new Error(`Unsupported graph response version: ${data.payload.version}`);
      }
      setGraphResponse(data.payload);
      setIsDemo(false);
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, position: 'relative' }}>
      <GraphResponseRenderer graphResponse={graphResponse} />
      {isDemo && (
        <div
          style={{
            position: 'absolute',
            right: 16,
            top: 16,
            background: 'rgba(255,255,255,0.75)',
            border: '1px solid rgba(100,116,139,0.3)',
            borderRadius: 8,
            padding: '6px 10px',
            fontSize: '0.75rem',
            color: '#475569',
          }}
        >
          demo payload loaded
        </div>
      )}
    </div>
  );
};

export default GraphEmbedPage;
