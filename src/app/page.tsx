/**
 * @fileoverview Platform landing page.
 * Exports: Home
 */
import React from 'react';
import Link from 'next/link';
import { GraphNodesBg } from '@/components/graph-nodes-bg';

/** Integration methods — four entry points into the platform. */
const INTEGRATION_METHODS = [
  {
    n: '01',
    title: 'react renderer',
    desc: 'drop in GraphResponseRenderer and pass a GraphResponseV0 payload.',
    href: '/examples/react',
  },
  {
    n: '02',
    title: 'web component',
    desc: 'register intellea-graph and set graphResponse on the element.',
    href: '/examples/web-component',
  },
  {
    n: '03',
    title: 'iframe embed',
    desc: 'postMessage a payload into the embed shell for host isolation.',
    href: '/examples/iframe',
  },
  {
    n: '04',
    title: 'mcp tool',
    desc: 'generate GraphResponseV0 from markdown for downstream apps.',
    href: '/examples/mcp',
  },
] as const;

export default function Home() {
  return (
    <main className="min-h-screen">

      {/* ── hero ─────────────────────────────────────────────────────────── */}
      <section
        className="relative flex flex-col justify-center overflow-hidden"
        style={{ minHeight: 'calc(100vh - 52px)' }}
      >
        {/* animated graph — right half, desktop only */}
        <div className="absolute right-0 top-0 w-1/2 h-full pointer-events-none hidden md:block"
             style={{ opacity: 0.55 }}>
          <GraphNodesBg />
        </div>

        {/* gradient: fade graph into page at bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
          style={{ background: 'linear-gradient(to top, #07090D, transparent)' }}
        />

        {/* hero content */}
        <div className="relative z-10 max-w-5xl mx-auto w-full px-6 py-20 md:py-28">
          <div className="md:max-w-[54%]">

            {/* eyebrow */}
            <p
              className="text-[11px] tracking-[0.3em] uppercase mb-8"
              style={{ color: 'rgba(10,255,217,0.5)' }}
            >
              intellea graph platform
            </p>

            {/* headline — Instrument Serif italic, large */}
            <h1
              className="font-display text-foreground leading-[0.92] mb-8"
              style={{ fontSize: 'clamp(2.8rem, 7vw, 5.5rem)' }}
            >
              graph-first<br />
              output surfaces<br />
              for llm products
            </h1>

            {/* description */}
            <p className="text-sm text-muted-foreground max-w-sm mb-10 leading-relaxed">
              render GraphResponseV0 payloads as fast, interactive 3d graphs.
              ship the react renderer, web component, iframe embed, or generate
              payloads via the mcp tool.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Link
                href="/docs"
                className="text-xs px-4 py-2 border transition-colors duration-150"
                style={{
                  borderColor: 'rgba(10,255,217,0.35)',
                  background: 'rgba(10,255,217,0.06)',
                  color: '#0AFFD9',
                }}
              >
                read the docs
              </Link>
              <Link
                href="/examples"
                className="text-xs px-4 py-2 border border-border text-muted-foreground hover:text-foreground hover:border-white/15 transition-colors duration-150"
              >
                browse examples
              </Link>
              <Link
                href="/embed/graph"
                className="text-xs px-4 py-2 border border-border text-muted-foreground hover:text-foreground hover:border-white/15 transition-colors duration-150"
              >
                open embed shell ↗
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── spec strip ───────────────────────────────────────────────────── */}
      <div className="border-t border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex flex-wrap gap-x-8 gap-y-2">
          {[
            'schema-first',
            'GraphResponseV0',
            '4 integration surfaces',
            'zero server deps',
            'tree-shakeable',
            'postMessage api',
          ].map((item) => (
            <span key={item} className="text-[11px] text-muted-foreground/60 tracking-wide">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── integration methods ──────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <p className="text-[11px] tracking-[0.25em] uppercase text-muted-foreground/50 mb-8">
          integration surfaces
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 border-l border-t border-border">
          {INTEGRATION_METHODS.map(({ n, title, desc, href }) => (
            <Link
              key={n}
              href={href}
              className="group border-r border-b border-border p-6 flex flex-col gap-3 transition-colors duration-150 hover:bg-white/[0.02]"
            >
              <span className="text-[10px] font-mono text-muted-foreground/40">
                {n}
              </span>
              <h3
                className="text-sm font-mono text-foreground/80 group-hover:text-foreground transition-colors duration-150"
                style={{ transition: 'color 150ms' }}
              >
                {title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                {desc}
              </p>
              <span
                className="text-[11px] opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                style={{ color: '#0AFFD9' }}
              >
                view example →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── quick start ──────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <p className="text-[11px] tracking-[0.25em] uppercase text-muted-foreground/50 mb-8">
          quick start
        </p>

        {/* terminal window */}
        <div className="border border-border overflow-hidden">
          {/* title bar */}
          <div
            className="flex items-center gap-2 px-4 py-3 border-b border-border"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <span className="w-3 h-3 rounded-full" style={{ background: 'rgba(255,100,100,0.35)' }} />
            <span className="w-3 h-3 rounded-full" style={{ background: 'rgba(255,200,100,0.35)' }} />
            <span className="w-3 h-3 rounded-full" style={{ background: 'rgba(100,220,100,0.35)' }} />
            <span className="ml-3 text-[11px] text-muted-foreground/40">shell</span>
          </div>

          {/* code content */}
          <div className="p-6 text-xs leading-6 overflow-x-auto" style={{ background: '#060810' }}>

            {/* install */}
            <div className="mb-6">
              <p>
                <span style={{ color: 'rgba(10,255,217,0.5)' }}>$</span>
                {' '}
                <span style={{ color: '#566070' }}>pnpm add</span>
                {' '}
                <span style={{ color: '#DDE4EF' }}>@intellea/graph-renderer @intellea/graph-schema</span>
              </p>
            </div>

            {/* imports */}
            <div className="mb-1">
              <span style={{ color: '#7B8CDE' }}>import</span>
              {' '}
              <span style={{ color: '#DDE4EF' }}>{'{ GraphResponseRenderer }'}</span>
              {' '}
              <span style={{ color: '#7B8CDE' }}>from</span>
              {' '}
              <span style={{ color: '#E6A96A' }}>&apos;@intellea/graph-renderer&apos;</span>
              <span style={{ color: '#566070' }}>;</span>
            </div>
            <div className="mb-6">
              <span style={{ color: '#7B8CDE' }}>import</span>
              {' '}
              <span style={{ color: '#7B8CDE' }}>type</span>
              {' '}
              <span style={{ color: '#DDE4EF' }}>{'{ GraphResponseV0 }'}</span>
              {' '}
              <span style={{ color: '#7B8CDE' }}>from</span>
              {' '}
              <span style={{ color: '#E6A96A' }}>&apos;@intellea/graph-schema&apos;</span>
              <span style={{ color: '#566070' }}>;</span>
            </div>

            {/* component */}
            <div>
              <span style={{ color: '#7B8CDE' }}>function</span>
              {' '}
              <span style={{ color: '#0AFFD9' }}>App</span>
              <span style={{ color: '#566070' }}>{'('}</span>
              <span style={{ color: '#DDE4EF' }}>{'{ payload }'}</span>
              <span style={{ color: '#566070' }}>:</span>
              {' '}
              <span style={{ color: '#566070' }}>{'{'}</span>
              {' '}
              <span style={{ color: '#DDE4EF' }}>payload</span>
              <span style={{ color: '#566070' }}>:</span>
              {' '}
              <span style={{ color: '#0AFFD9' }}>GraphResponseV0</span>
              {' '}
              <span style={{ color: '#566070' }}>{'}'}</span>
              <span style={{ color: '#566070' }}>{')'}</span>
              {' '}
              <span style={{ color: '#566070' }}>{'{'}</span>
            </div>
            <div className="ml-6">
              <span style={{ color: '#7B8CDE' }}>return</span>
              {' '}
              <span style={{ color: '#566070' }}>{'<'}</span>
              <span style={{ color: '#0AFFD9' }}>GraphResponseRenderer</span>
              {' '}
              <span style={{ color: '#DDE4EF' }}>graphResponse</span>
              <span style={{ color: '#566070' }}>=</span>
              <span style={{ color: '#566070' }}>{'{'}</span>
              <span style={{ color: '#DDE4EF' }}>payload</span>
              <span style={{ color: '#566070' }}>{'}'}</span>
              {' '}
              <span style={{ color: '#566070' }}>{'/'}</span>
              <span style={{ color: '#566070' }}>{'>'}</span>
            </div>
            <div>
              <span style={{ color: '#566070' }}>{'}'}</span>
            </div>
          </div>
        </div>

        {/* docs link below code */}
        <div className="mt-6 flex gap-4">
          <Link
            href="/docs"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            full documentation →
          </Link>
          <Link
            href="/docs/embedding"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            embedding guide →
          </Link>
        </div>
      </section>

    </main>
  );
}
