/**
 * @fileoverview Skill wrapper docs.
 */

import React from 'react';
import Link from 'next/link';

const SkillsDocsPage = () => {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-8">
        <header className="space-y-2">
          <Link href="/docs" className="text-sm text-muted-foreground">back to docs</Link>
          <h1 className="text-3xl font-semibold">skills wrapper</h1>
          <p className="text-muted-foreground">
            open skill metadata that describes how to generate GraphResponseV0 payloads.
          </p>
        </header>

        <section className="rounded-lg border bg-card p-4 space-y-3">
          <h2 className="text-lg font-semibold">skill file</h2>
          <p className="text-sm text-muted-foreground">
            <code className="rounded bg-muted px-1">skills/intellea-graph-response/SKILL.md</code>
          </p>
        </section>

        <section className="rounded-lg border bg-card p-4 space-y-3">
          <h2 className="text-lg font-semibold">intent</h2>
          <p className="text-sm text-muted-foreground">
            define a reusable wrapper for tools that emit graph responses.
          </p>
        </section>
      </div>
    </main>
  );
};

export default SkillsDocsPage;
