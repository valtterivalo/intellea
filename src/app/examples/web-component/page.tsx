/**
 * @fileoverview Web component example.
 */

import React from 'react';
import Link from 'next/link';
import WebComponentPreview from '../components/WebComponentPreview';
import { sampleGraphResponse } from '../lib/sampleGraph';

const WebComponentExamplePage = () => {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-8">
        <header className="space-y-2">
          <Link href="/examples" className="text-sm text-muted-foreground">back to examples</Link>
          <h1 className="text-3xl font-semibold">web component</h1>
          <p className="text-muted-foreground">register <code className="rounded bg-muted px-1">intellea-graph</code> and set payload.</p>
        </header>

        <section className="rounded-lg border bg-card p-4 space-y-3">
          <h2 className="text-lg font-semibold">live preview</h2>
          <WebComponentPreview graphResponse={sampleGraphResponse} />
        </section>
        <section className="rounded-lg border bg-card p-4">
          <div className="rounded-md bg-muted p-3 text-xs font-mono whitespace-pre-wrap">
            {`<div style="height: 600px">\n  <intellea-graph></intellea-graph>\n</div>\n\n<script type="module">\n  import { defineGraphResponseElement } from '@intellea/graph-renderer';\n  import payload from '../payloads/graph-response-v0.json' assert { type: 'json' };\n\n  defineGraphResponseElement();\n\n  const el = document.querySelector('intellea-graph');\n  if (!el) throw new Error('missing graph element');\n\n  el.graphResponse = payload;\n</script>`}
          </div>
        </section>
      </div>
    </main>
  );
};

export default WebComponentExamplePage;
