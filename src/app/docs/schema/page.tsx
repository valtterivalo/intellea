/**
 * @fileoverview Graph response schema docs.
 */

import React from 'react';
import Link from 'next/link';

const SchemaDocsPage = () => {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-8">
        <header className="space-y-2">
          <Link href="/docs" className="text-sm text-muted-foreground">back to docs</Link>
          <h1 className="text-3xl font-semibold">graph response schema</h1>
          <p className="text-muted-foreground">
            GraphResponseV0 is the contract between adapters and renderers.
          </p>
        </header>

        <section className="rounded-lg border bg-card p-4 space-y-3">
          <h2 className="text-lg font-semibold">core shape</h2>
          <div className="rounded-md bg-muted p-3 text-xs font-mono whitespace-pre-wrap">
            {`GraphResponseV0\n  - version: 'v0'\n  - mode: 'map' | 'decision' | 'plan' | 'argument'\n  - nodes: GraphNodeV0[]\n  - edges: GraphEdgeV0[]\n  - layout?: GraphLayoutHintV0\n  - view?: GraphViewHintV0\n  - meta?: Record<string, unknown>`}
          </div>
        </section>

        <section className="rounded-lg border bg-card p-4 space-y-3">
          <h2 className="text-lg font-semibold">where it lives</h2>
          <p className="text-sm text-muted-foreground">
            source of truth: <code className="rounded bg-muted px-1">@intellea/graph-schema</code>
          </p>
          <p className="text-sm text-muted-foreground">
            see <code className="rounded bg-muted px-1">docs/graph-response-schema.md</code> for the full detail.
          </p>
        </section>
      </div>
    </main>
  );
};

export default SchemaDocsPage;
