/**
 * @fileoverview Next.js app router example.
 */

import React from 'react';
import Link from 'next/link';
import GraphRendererPreview from '../components/GraphRendererPreview';
import { sampleGraphResponse } from '../lib/sampleGraph';

const NextAppRouterExamplePage = () => {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-8">
        <header className="space-y-2">
          <Link href="/examples" className="text-sm text-muted-foreground">back to examples</Link>
          <h1 className="text-3xl font-semibold">next.js app router</h1>
          <p className="text-muted-foreground">drop into app/page.tsx.</p>
        </header>

        <section className="rounded-lg border bg-card p-4 space-y-3">
          <h2 className="text-lg font-semibold">live preview</h2>
          <GraphRendererPreview graphResponse={sampleGraphResponse} />
        </section>
        <section className="rounded-lg border bg-card p-4">
          <div className="rounded-md bg-muted p-3 text-xs font-mono whitespace-pre-wrap">
            {`import { GraphResponseRenderer } from '@intellea/graph-renderer';\nimport type { GraphResponseV0 } from '@intellea/graph-schema';\nimport payload from '../payloads/graph-response-v0.json';\n\nconst graphResponse = payload as GraphResponseV0;\n\nexport default function Page() {\n  return (\n    <main style={{ height: '100vh', padding: 24 }}>\n      <GraphResponseRenderer graphResponse={graphResponse} />\n    </main>\n  );\n}`}
          </div>
        </section>
      </div>
    </main>
  );
};

export default NextAppRouterExamplePage;
