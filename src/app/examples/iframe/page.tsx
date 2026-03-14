/**
 * @fileoverview Iframe embed example.
 */

import React from 'react';
import Link from 'next/link';
import IframePreview from '../components/IframePreview';
import { sampleGraphResponse } from '../lib/sampleGraph';

const IframeExamplePage = () => {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-8">
        <header className="space-y-2">
          <Link href="/examples" className="text-sm text-muted-foreground">back to examples</Link>
          <h1 className="text-3xl font-semibold">iframe embed</h1>
          <p className="text-muted-foreground">postMessage a payload into the embed shell.</p>
        </header>

        <section className="rounded-lg border bg-card p-4 space-y-3">
          <h2 className="text-lg font-semibold">live preview</h2>
          <IframePreview graphResponse={sampleGraphResponse} />
        </section>
        <section className="rounded-lg border bg-card p-4">
          <div className="rounded-md bg-muted p-3 text-xs font-mono whitespace-pre-wrap">
            {`<iframe id="graph" src="https://www.intellea.app/embed/graph" style="width:100%;height:600px;border:0"></iframe>\n\n<script type="module">\n  import payload from '../payloads/graph-response-v0.json' assert { type: 'json' };\n\n  const frame = document.querySelector('#graph');\n  if (!frame?.contentWindow) throw new Error('missing iframe');\n\n  frame.contentWindow.postMessage(\n    { type: 'intellea:graph-response', payload },\n    '*'\n  );\n</script>`}
          </div>
        </section>
      </div>
    </main>
  );
};

export default IframeExamplePage;
