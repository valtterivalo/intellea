/**
 * @fileoverview React renderer example.
 */

import React from 'react';
import Link from 'next/link';

const ReactExamplePage = () => {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-8">
        <header className="space-y-2">
          <Link href="/examples" className="text-sm text-muted-foreground">back to examples</Link>
          <h1 className="text-3xl font-semibold">react renderer</h1>
          <p className="text-muted-foreground">use GraphResponseRenderer in any react app.</p>
        </header>

        <section className="rounded-lg border bg-card p-4">
          <div className="rounded-md bg-muted p-3 text-xs font-mono whitespace-pre-wrap">
            {`import React from 'react';\nimport { GraphResponseRenderer } from '@intellea/graph-renderer';\nimport type { GraphResponseV0 } from '@intellea/graph-schema';\nimport payload from '../payloads/graph-response-v0.json';\n\nconst graphResponse = payload as GraphResponseV0;\n\nexport default function GraphPanel() {\n  return <GraphResponseRenderer graphResponse={graphResponse} />;\n}`}
          </div>
        </section>
      </div>
    </main>
  );
};

export default ReactExamplePage;
