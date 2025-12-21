/**
 * @fileoverview MCP tool docs.
 */

import React from 'react';
import Link from 'next/link';

const McpDocsPage = () => {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-8">
        <header className="space-y-2">
          <Link href="/docs" className="text-sm text-muted-foreground">back to docs</Link>
          <h1 className="text-3xl font-semibold">mcp graph response tool</h1>
          <p className="text-muted-foreground">
            stdio mcp server that emits GraphResponseV0 from markdown.
          </p>
        </header>

        <section className="rounded-lg border bg-card p-4 space-y-3">
          <h2 className="text-lg font-semibold">run</h2>
          <div className="rounded-md bg-muted p-3 text-xs font-mono whitespace-pre-wrap">
            {`pnpm mcp:graph-response`}
          </div>
        </section>

        <section className="rounded-lg border bg-card p-4 space-y-3">
          <h2 className="text-lg font-semibold">tool</h2>
          <p className="text-sm text-muted-foreground">graph_response_from_markdown</p>
          <div className="rounded-md bg-muted p-3 text-xs font-mono whitespace-pre-wrap">
            {`{\n  "markdown": "string",\n  "mode": "map | decision | plan | argument",\n  "maxNodes": 10..2000\n}`}
          </div>
        </section>
      </div>
    </main>
  );
};

export default McpDocsPage;
