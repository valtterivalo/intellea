'use client';
/**
 * @fileoverview Session breadcrumb navigation component.
 * Exports Breadcrumbs.
 */

import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';

const Breadcrumbs: React.FC = () => {
  const visitedNodeIds = useAppStore((state) => state.visitedNodeIds);
  const output = useAppStore((state) => state.output);
  const setSelectedNodeId = useAppStore((state) => state.setSelectedNodeId);
  const setActiveFocusPath = useAppStore((state) => state.setActiveFocusPath);

  if (!visitedNodeIds.length || !output || typeof output !== 'object') {
    return null;
  }

  const vizData = 'visualizationData' in output ? output.visualizationData : null;

  const getLabel = (id: string) => {
    const node = vizData?.nodes.find((n) => n.id === id);
    return node?.label || id;
  };

  const handleClick = (id: string) => {
    if (!vizData) return;
    setSelectedNodeId(id);
    setActiveFocusPath(id, vizData);
  };

  return (
    <nav className="flex flex-wrap items-center gap-1 text-sm mb-2" aria-label="Breadcrumb">
      {visitedNodeIds.map((id, idx) => (
        <span key={id} className="flex items-center gap-1">
          {idx > 0 && <span>/</span>}
          <Button variant="link" className="p-0 h-auto" onClick={() => handleClick(id)}>
            {getLabel(id)}
          </Button>
        </span>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
