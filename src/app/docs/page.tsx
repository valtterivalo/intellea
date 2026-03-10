/**
 * @fileoverview Docs landing page.
 * Exports: DocsPage
 */
import React from 'react';
import Link from 'next/link';

/** Top-level docs sections. */
const DOC_SECTIONS = [
  {
    title: 'graph response schema',
    desc: 'the contract between adapters and renderers. GraphResponseV0 shape, modes, and versioning.',
    href: '/docs/schema',
  },
  {
    title: 'embedding',
    desc: 'web component and iframe entry points for third-party apps and host isolation.',
    href: '/docs/embedding',
  },
  {
    title: 'adapters',
    desc: 'markdown and custom adapters that produce GraphResponseV0 payloads.',
    href: '/docs/adapters',
  },
  {
    title: 'mcp tool',
    desc: 'stdio mcp server that emits GraphResponseV0 from markdown input.',
    href: '/docs/mcp',
  },
  {
    title: 'skills wrapper',
    desc: 'open skill metadata for tools that generate graph responses.',
    href: '/docs/skills',
  },
  {
    title: 'examples',
    desc: 'minimal integrations for react, web components, iframe, and mcp.',
    href: '/docs/examples',
  },
] as const;

const DocsPage = () => {
  return (
    <main className="max-w-5xl mx-auto px-6 py-16">

      {/* header */}
      <header className="mb-12">
        <p className="text-[11px] tracking-[0.3em] uppercase mb-4" style={{ color: 'rgba(10,255,217,0.5)' }}>
          documentation
        </p>
        <h1 className="font-display text-foreground leading-tight mb-4" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
          graph response platform
        </h1>
        <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
          schema-first graph output with adapters, a renderer, and embeddable surfaces.
        </p>
      </header>

      {/* section grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 border-l border-t border-border mb-12">
        {DOC_SECTIONS.map(({ title, desc, href }) => (
          <Link
            key={href}
            href={href}
            className="group border-r border-b border-border p-6 flex flex-col gap-2 transition-colors duration-150 hover:bg-white/[0.02]"
          >
            <h2 className="text-sm font-mono text-foreground/80 group-hover:text-foreground transition-colors duration-150">
              {title}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed flex-1">{desc}</p>
            <span
              className="text-[11px] opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              style={{ color: '#0AFFD9' }}
            >
              read →
            </span>
          </Link>
        ))}
      </div>

      {/* quick start */}
      <div className="border border-border p-6">
        <p className="text-[11px] tracking-[0.25em] uppercase text-muted-foreground/50 mb-4">quick start</p>
        <div className="text-xs font-mono text-muted-foreground leading-relaxed whitespace-pre">{`pnpm add @intellea/graph-renderer @intellea/graph-schema

import { GraphResponseRenderer } from '@intellea/graph-renderer';
import type { GraphResponseV0 } from '@intellea/graph-schema';

<GraphResponseRenderer graphResponse={payload} />`}</div>
      </div>

    </main>
  );
};

export default DocsPage;
