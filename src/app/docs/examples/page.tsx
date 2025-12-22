/**
 * @fileoverview Integration examples docs.
 */

import React from 'react';
import Link from 'next/link';

const ExamplesDocsPage = () => {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-8">
        <header className="space-y-2">
          <Link href="/docs" className="text-sm text-muted-foreground">back to docs</Link>
          <h1 className="text-3xl font-semibold">examples</h1>
          <p className="text-muted-foreground">
            minimal integrations for the renderer, web component, iframe, and mcp tool.
          </p>
          <Link href="/examples" className="text-sm text-muted-foreground">open live examples</Link>
        </header>

        <section className="rounded-lg border bg-card p-4 space-y-2 text-sm text-muted-foreground">
          <p><code className="rounded bg-muted px-1">examples/react</code> react renderer</p>
          <p><code className="rounded bg-muted px-1">examples/next-app-router</code> next.js app router</p>
          <p><code className="rounded bg-muted px-1">examples/web-component</code> web component</p>
          <p><code className="rounded bg-muted px-1">examples/iframe</code> iframe embed</p>
          <p><code className="rounded bg-muted px-1">examples/mcp</code> mcp client</p>
        </section>
      </div>
    </main>
  );
};

export default ExamplesDocsPage;
