/**
 * @fileoverview Docs landing page for graph response tooling.
 */

import React from 'react';
import Link from 'next/link';

const DocsPage = () => {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-6 py-16 space-y-10">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-wide text-muted-foreground">intellea docs</p>
          <h1 className="text-3xl sm:text-4xl font-semibold">graph response platform</h1>
          <p className="text-muted-foreground max-w-2xl">
            schema-first graph output with adapters, a renderer, and embeddable surfaces.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border bg-card p-4 space-y-2">
            <h2 className="text-lg font-semibold">graph response schema</h2>
            <p className="text-sm text-muted-foreground">
              the contract for any tool that wants to render a graph response.
            </p>
            <Link className="text-sm text-primary" href="/docs/schema">
              view schema overview
            </Link>
          </div>
          <div className="rounded-lg border bg-card p-4 space-y-2">
            <h2 className="text-lg font-semibold">embedding</h2>
            <p className="text-sm text-muted-foreground">
              web component and iframe entry points for third-party apps.
            </p>
            <Link className="text-sm text-primary" href="/docs/embedding">
              view embedding notes
            </Link>
          </div>
          <div className="rounded-lg border bg-card p-4 space-y-2">
            <h2 className="text-lg font-semibold">mcp tool</h2>
            <p className="text-sm text-muted-foreground">
              stdio mcp server that emits GraphResponseV0 payloads.
            </p>
            <Link className="text-sm text-primary" href="/docs/mcp">
              view mcp usage
            </Link>
          </div>
          <div className="rounded-lg border bg-card p-4 space-y-2">
            <h2 className="text-lg font-semibold">skills wrapper</h2>
            <p className="text-sm text-muted-foreground">
              open skill metadata for tools that generate graph responses.
            </p>
            <Link className="text-sm text-primary" href="/docs/skills">
              view skill details
            </Link>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-4 space-y-3">
          <h2 className="text-lg font-semibold">quick start</h2>
          <p className="text-sm text-muted-foreground">
            run the renderer in your app or embed it in an iframe.
          </p>
          <div className="rounded-md bg-muted p-3 text-xs font-mono whitespace-pre-wrap">
            {`pnpm add @intellea/graph-renderer @intellea/graph-schema\n\nimport { GraphResponseRenderer } from '@intellea/graph-renderer';\nimport type { GraphResponseV0 } from '@intellea/graph-schema';\n\n<GraphResponseRenderer graphResponse={payload} />`}
          </div>
        </section>
      </div>
    </main>
  );
};

export default DocsPage;
