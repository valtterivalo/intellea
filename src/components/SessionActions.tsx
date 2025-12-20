'use client';
/**
 * @fileoverview Session export and summary actions.
 * Exports: SessionActions
 */

import React, { useMemo, useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/store/useAppStore';
import { isIntelleaResponse } from '@/store/utils';
import { computeProgress } from '@/lib/progress';
import { Button } from '@/components/ui/button';

const SESSION_EXPORT_VERSION = 'v1';

const SessionActions: React.FC = () => {
  const {
    output,
    currentSessionTitle,
    activePrompt,
    completedNodeIds,
  } = useAppStore(
    useShallow((state) => ({
      output: state.output,
      currentSessionTitle: state.currentSessionTitle,
      activePrompt: state.activePrompt,
      completedNodeIds: state.completedNodeIds,
    }))
  );

  const [copied, setCopied] = useState(false);

  const sessionSnapshot = useMemo(() => {
    if (!isIntelleaResponse(output)) return null;
    const nodes = output.visualizationData.nodes;
    const links = output.visualizationData.links;
    const cards = output.knowledgeCards || [];
    const progress = computeProgress(nodes.length, completedNodeIds);

    const title = currentSessionTitle || output.sessionTitle || 'Untitled Session';
    const prompt = activePrompt || '';

    const summaryLines = [
      `title: ${title}`,
      prompt ? `prompt: ${prompt}` : null,
      `nodes: ${nodes.length} | links: ${links.length} | cards: ${cards.length}`,
      `learned: ${completedNodeIds.size}/${nodes.length} (${Math.round(progress)}%)`,
    ].filter(Boolean) as string[];

    const topNodes = nodes.slice(0, 6).map((node) => node.label || node.id);
    if (topNodes.length > 0) {
      summaryLines.push(`highlights: ${topNodes.join(', ')}`);
    }

    return {
      exportData: {
        version: SESSION_EXPORT_VERSION,
        exportedAt: new Date().toISOString(),
        title,
        prompt,
        progress: {
          completed: completedNodeIds.size,
          total: nodes.length,
          percent: Math.round(progress),
        },
        data: {
          explanationMarkdown: output.explanationMarkdown,
          knowledgeCards: output.knowledgeCards,
          visualizationData: output.visualizationData,
        },
      },
      summary: summaryLines.join('\n'),
      fileName: title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'intellea-session',
    };
  }, [output, currentSessionTitle, activePrompt, completedNodeIds]);

  const handleExport = () => {
    if (!sessionSnapshot) return;
    const blob = new Blob([JSON.stringify(sessionSnapshot.exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sessionSnapshot.fileName}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleCopySummary = () => {
    if (!sessionSnapshot) return;
    navigator.clipboard.writeText(sessionSnapshot.summary).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  };

  const isReady = Boolean(sessionSnapshot);

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleExport} disabled={!isReady}>
        <Download className="mr-2 h-4 w-4" />
        Export JSON
      </Button>
      <Button variant="outline" size="sm" onClick={handleCopySummary} disabled={!isReady}>
        {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
        {copied ? 'Copied' : 'Copy summary'}
      </Button>
    </div>
  );
};

export default SessionActions;
