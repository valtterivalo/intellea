/**
 * @fileoverview Graph embedding docs.
 */

import React from 'react';
import Link from 'next/link';

const EmbeddingDocsPage = () => {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-8">
        <header className="space-y-2">
          <Link href="/docs" className="text-sm text-muted-foreground">back to docs</Link>
          <h1 className="text-3xl font-semibold">embedding</h1>
          <p className="text-muted-foreground">
            use the web component or iframe embed to render graphs outside the app.
          </p>
        </header>

        <section className="rounded-lg border bg-card p-4 space-y-3">
          <h2 className="text-lg font-semibold">web component</h2>
          <div className="rounded-md bg-muted p-3 text-xs font-mono whitespace-pre-wrap">
            {`import { defineGraphResponseElement } from '@intellea/graph-renderer';\nimport type { GraphResponseV0 } from '@intellea/graph-schema';\n\ndefineGraphResponseElement();\n\nconst element = document.querySelector('intellea-graph');\nif (!element) throw new Error('missing graph element');\n\n(element as HTMLElement & { graphResponse: GraphResponseV0 }).graphResponse = payload;`}
          </div>
        </section>

        <section className="rounded-lg border bg-card p-4 space-y-3">
          <h2 className="text-lg font-semibold">iframe</h2>
          <div className="rounded-md bg-muted p-3 text-xs font-mono whitespace-pre-wrap">
            {`const iframe = document.querySelector('iframe');\nif (!iframe?.contentWindow) throw new Error('missing iframe');\n\niframe.contentWindow.postMessage(\n  { type: 'intellea:graph-response', payload },\n  '*'\n);`}
          </div>
        </section>
      </div>
    </main>
  );
};

export default EmbeddingDocsPage;
