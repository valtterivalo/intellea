/**
 * @fileoverview MCP tool example.
 */

import React from 'react';
import Link from 'next/link';
import { markdownToGraphResponse } from '@intellea/graph-adapters';
import GraphRendererPreview from '../components/GraphRendererPreview';

const sampleMarkdown = `# launch plan
- research
- build
- ship`;
const sampleGraphResponse = markdownToGraphResponse(sampleMarkdown, { mode: 'plan', maxNodes: 200 });

const McpExamplePage = () => {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-8">
        <header className="space-y-2">
          <Link href="/examples" className="text-sm text-muted-foreground">back to examples</Link>
          <h1 className="text-3xl font-semibold">mcp tool</h1>
          <p className="text-muted-foreground">convert markdown into GraphResponseV0.</p>
        </header>

        <section className="rounded-lg border bg-card p-4 space-y-3">
          <h2 className="text-lg font-semibold">live preview</h2>
          <GraphRendererPreview graphResponse={sampleGraphResponse} />
        </section>
        <section className="rounded-lg border bg-card p-4 space-y-3">
          <div className="rounded-md bg-muted p-3 text-xs font-mono whitespace-pre-wrap">
            {`pnpm mcp:graph-response`}
          </div>
          <div className="rounded-md bg-muted p-3 text-xs font-mono whitespace-pre-wrap">
            {`{\n  \"tool\": \"graph_response_from_markdown\",\n  \"input\": {\n    \"markdown\": \"# launch plan\\n- research\\n- build\\n- ship\",\n    \"mode\": \"plan\",\n    \"maxNodes\": 200\n  }\n}`}
          </div>
        </section>
      </div>
    </main>
  );
};

export default McpExamplePage;
