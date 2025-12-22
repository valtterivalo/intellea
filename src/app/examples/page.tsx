/**
 * @fileoverview Examples landing page for platform integrations.
 */

import React from 'react';
import Link from 'next/link';

const ExamplesPage = () => {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-6 py-16 space-y-8">
        <header className="space-y-3">
          <Link href="/" className="text-sm text-muted-foreground">back to home</Link>
          <h1 className="text-3xl sm:text-4xl font-semibold">examples</h1>
          <p className="text-muted-foreground max-w-2xl">
            these pages mirror the code in <code className="rounded bg-muted px-1">examples/</code>.
            pick your stack, preview the output, and copy the snippet.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          <Link href="/examples/react" className="rounded-lg border bg-card p-4 space-y-2">
            <h2 className="text-lg font-semibold">react renderer</h2>
            <p className="text-sm text-muted-foreground">GraphResponseRenderer usage.</p>
          </Link>
          <Link href="/examples/next-app-router" className="rounded-lg border bg-card p-4 space-y-2">
            <h2 className="text-lg font-semibold">next.js app router</h2>
            <p className="text-sm text-muted-foreground">drop into app/page.tsx.</p>
          </Link>
          <Link href="/examples/web-component" className="rounded-lg border bg-card p-4 space-y-2">
            <h2 className="text-lg font-semibold">web component</h2>
            <p className="text-sm text-muted-foreground">intellea-graph element.</p>
          </Link>
          <Link href="/examples/iframe" className="rounded-lg border bg-card p-4 space-y-2">
            <h2 className="text-lg font-semibold">iframe embed</h2>
            <p className="text-sm text-muted-foreground">postMessage payloads.</p>
          </Link>
          <Link href="/examples/mcp" className="rounded-lg border bg-card p-4 space-y-2">
            <h2 className="text-lg font-semibold">mcp tool</h2>
            <p className="text-sm text-muted-foreground">generate GraphResponseV0 from markdown.</p>
          </Link>
        </section>
      </div>
    </main>
  );
};

export default ExamplesPage;
