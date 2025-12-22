/**
 * @fileoverview Graph response adapters docs.
 */

import React from 'react';
import Link from 'next/link';

const AdaptersDocsPage = () => {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-8">
        <header className="space-y-2">
          <Link href="/docs" className="text-sm text-muted-foreground">back to docs</Link>
          <h1 className="text-3xl font-semibold">adapters</h1>
          <p className="text-muted-foreground">
            map markdown or custom inputs into GraphResponseV0 payloads.
          </p>
        </header>

        <section className="rounded-lg border bg-card p-4 space-y-3">
          <h2 className="text-lg font-semibold">install</h2>
          <div className="rounded-md bg-muted p-3 text-xs font-mono whitespace-pre-wrap">
            {`pnpm add @intellea/graph-adapters`}
          </div>
        </section>

        <section className="rounded-lg border bg-card p-4 space-y-3">
          <h2 className="text-lg font-semibold">markdown adapter</h2>
          <div className="rounded-md bg-muted p-3 text-xs font-mono whitespace-pre-wrap">
            {`import { markdownToGraphResponse } from '@intellea/graph-adapters';\n\nconst graph = markdownToGraphResponse(markdown, { maxNodes: 200, mode: 'map' });`}
          </div>
        </section>
      </div>
    </main>
  );
};

export default AdaptersDocsPage;
