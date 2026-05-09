/**
 * @fileoverview WebGPU renderer example.
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import GraphRendererPreview from '../components/GraphRendererPreview';
import { sampleGraphResponse } from '../lib/sampleGraph';
import { isWebGPUSupported, getWebGPUSupportInfo } from '@intellea/graph-renderer';
import { GraphResponseRenderer } from '@intellea/graph-renderer';

const WebGPUExamplePage = () => {
  const [useWebGPU, setUseWebGPU] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [supportInfo, setSupportInfo] = useState<string | null>(null);

  useEffect(() => {
    const checkSupport = async () => {
      const supported = isWebGPUSupported();
      setIsSupported(supported);

      if (supported) {
        const info = await getWebGPUSupportInfo();
        setSupportInfo(info.adapterInfo);
      }
    };

    checkSupport();
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-8">
        <header className="space-y-2">
          <Link href="/examples" className="text-sm text-muted-foreground">back to examples</Link>
          <h1 className="text-3xl font-semibold">webgpu renderer</h1>
          <p className="text-muted-foreground">gpu-accelerated rendering for large graphs (10k+ nodes).</p>
        </header>

        <section className="rounded-lg border bg-card p-4 space-y-4">
          <h2 className="text-lg font-semibold">Configuration</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                WebGPU Support: {isSupported ? '✓' : '✗'}
              </label>
              {supportInfo && (
                <p className="text-xs text-muted-foreground/70">{supportInfo}</p>
              )}
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useWebGPU}
                  onChange={(e) => setUseWebGPU(e.target.checked)}
                  disabled={!isSupported}
                  className="w-4 h-4"
                />
                <span className="text-sm">Use WebGPU</span>
              </label>
            </div>
          </div>

          {!isSupported && (
            <p className="text-yellow-500 text-sm">
              WebGPU is not supported in this browser. Falling back to Three.js.
            </p>
          )}
        </section>

        <section className="rounded-lg border bg-card p-4 space-y-3">
          <h2 className="text-lg font-semibold">live preview</h2>
          <div className="h-[520px] w-full overflow-hidden rounded-md border bg-background">
            <GraphResponseRenderer
              graphResponse={sampleGraphResponse}
              useWebGPU={useWebGPU && isSupported}
              showPerfOverlay={true}
            />
          </div>
        </section>

        <section className="rounded-lg border bg-card p-4">
          <div className="rounded-md bg-muted p-3 text-xs font-mono whitespace-pre-wrap">
            {`import React from 'react';
import { GraphResponseRenderer } from '@intellea/graph-renderer';
import type { GraphResponseV0 } from '@intellea/graph-schema';
import payload from '../payloads/graph-response-v0.json';

const graphResponse = payload as GraphResponseV0;

export default function GraphPanel() {
  return (
    <GraphResponseRenderer
      graphResponse={graphResponse}
      useWebGPU={true}
    />
  );
}`}
          </div>
        </section>

        <section className="rounded-lg border bg-card p-4 space-y-3">
          <h2 className="text-lg font-semibold">Performance Tips</h2>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• WebGPU provides significant speedup for graphs with 5,000+ nodes</li>
            <li>• For small graphs (&lt; 1,000 nodes), Three.js may be equally fast</li>
            <li>• Enable performance overlay (NEXT_PUBLIC_DEBUG=true) to see FPS</li>
            <li>• Use Chrome 113+ or Edge 113+ for best WebGPU support</li>
          </ul>
        </section>
      </div>
    </main>
  );
};

export default WebGPUExamplePage;
