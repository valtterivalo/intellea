/**
 * @fileoverview Platform landing page.
 * Exports: Home
 */
import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-5xl flex-col gap-12 px-6 py-16">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            intellea graph platform
          </p>
          <h1 className="text-3xl font-semibold sm:text-5xl">
            graph-first output surfaces for llm products
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            render GraphResponseV0 payloads as fast, interactive graphs. use the react
            renderer, web component, iframe embed, or the mcp tool to generate payloads.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-md border border-primary bg-primary/10 px-3 py-2 text-sm text-primary"
              href="/docs"
            >
              read the docs
            </Link>
            <Link
              className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              href="/embed/graph"
            >
              open embed shell
            </Link>
            <Link
              className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              href="/docs/embedding"
            >
              embedding guide
            </Link>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border bg-card p-4 space-y-2">
            <h2 className="text-lg font-semibold">react renderer</h2>
            <p className="text-sm text-muted-foreground">
              drop in GraphResponseRenderer and pass a GraphResponseV0 payload.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4 space-y-2">
            <h2 className="text-lg font-semibold">web component</h2>
            <p className="text-sm text-muted-foreground">
              register <code className="rounded bg-muted px-1">intellea-graph</code> and set
              <code className="rounded bg-muted px-1">graphResponse</code>.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4 space-y-2">
            <h2 className="text-lg font-semibold">iframe embed</h2>
            <p className="text-sm text-muted-foreground">
              postMessage a payload into the embed shell for isolation.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4 space-y-2">
            <h2 className="text-lg font-semibold">mcp tool</h2>
            <p className="text-sm text-muted-foreground">
              generate GraphResponseV0 from markdown for downstream apps.
            </p>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-4 space-y-3">
          <h2 className="text-lg font-semibold">quick start</h2>
          <div className="rounded-md bg-muted p-3 text-xs font-mono whitespace-pre-wrap">
            {`pnpm add @intellea/graph-renderer @intellea/graph-schema\n\nimport { GraphResponseRenderer } from '@intellea/graph-renderer';\nimport type { GraphResponseV0 } from '@intellea/graph-schema';\n\n<GraphResponseRenderer graphResponse={payload} />`}
          </div>
        </section>
      </div>
    </main>
  );
}
