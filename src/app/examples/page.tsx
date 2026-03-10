/**
 * @fileoverview Examples landing page — mirrors the code in examples/.
 * Exports: ExamplesPage
 */
import React from 'react';
import Link from 'next/link';

/** Available example integrations. */
const EXAMPLES = [
  {
    n: '01',
    title: 'react renderer',
    desc: 'GraphResponseRenderer usage in a standard React app.',
    href: '/examples/react',
  },
  {
    n: '02',
    title: 'next.js app router',
    desc: 'drop-in usage inside app/page.tsx with the app router.',
    href: '/examples/next-app-router',
  },
  {
    n: '03',
    title: 'web component',
    desc: 'intellea-graph custom element with vanilla JS.',
    href: '/examples/web-component',
  },
  {
    n: '04',
    title: 'iframe embed',
    desc: 'postMessage a GraphResponseV0 payload into the embed shell.',
    href: '/examples/iframe',
  },
  {
    n: '05',
    title: 'mcp tool',
    desc: 'generate GraphResponseV0 from markdown via the stdio server.',
    href: '/examples/mcp',
  },
] as const;

const ExamplesPage = () => {
  return (
    <main className="max-w-5xl mx-auto px-6 py-16">

      {/* header */}
      <header className="mb-12">
        <p className="text-[11px] tracking-[0.3em] uppercase mb-4" style={{ color: 'rgba(10,255,217,0.5)' }}>
          examples
        </p>
        <h1 className="font-display text-foreground leading-tight mb-4" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
          integration examples
        </h1>
        <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
          these pages mirror the code in{' '}
          <code className="text-foreground/60">examples/</code>.
          pick your stack, preview the output, copy the snippet.
        </p>
      </header>

      {/* examples grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 border-l border-t border-border">
        {EXAMPLES.map(({ n, title, desc, href }) => (
          <Link
            key={href}
            href={href}
            className="group border-r border-b border-border p-6 flex flex-col gap-3 transition-colors duration-150 hover:bg-white/[0.02]"
          >
            <span className="text-[10px] font-mono text-muted-foreground/40">{n}</span>
            <h2 className="text-sm font-mono text-foreground/80 group-hover:text-foreground transition-colors duration-150">
              {title}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed flex-1">{desc}</p>
            <span
              className="text-[11px] opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              style={{ color: '#0AFFD9' }}
            >
              view example →
            </span>
          </Link>
        ))}
      </div>

    </main>
  );
};

export default ExamplesPage;
