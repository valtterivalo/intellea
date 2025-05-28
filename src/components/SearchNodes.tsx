'use client';

import React, { useState, useMemo } from 'react';
import { useAppStore, NodeObject, GraphData } from '@/store/useAppStore';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchNodesProps {
  className?: string;
}

const SearchNodes: React.FC<SearchNodesProps> = ({ className }) => {
  const output = useAppStore((state) => state.output);
  const setSelectedNodeId = useAppStore((state) => state.setSelectedNodeId);
  const setFocusedNodeId = useAppStore((state) => state.setFocusedNodeId);
  const setActiveFocusPath = useAppStore((state) => state.setActiveFocusPath);

  const nodes = useMemo(() => {
    if (!output || typeof output !== 'object' || !output.visualizationData || !Array.isArray(output.visualizationData.nodes)) {
      return [];
    }
    return output.visualizationData.nodes;
  }, [output]);

  const visualizationData = useMemo(() => {
    if (!output || typeof output !== 'object') {
      return null;
    }
    return output.visualizationData;
  }, [output]);

  const [query, setQuery] = useState('');

  const suggestions = useMemo(() => {
    if (!query.trim()) return [] as NodeObject[];
    const lower = query.toLowerCase();
    return nodes.filter((n) => (n.label || '').toLowerCase().includes(lower));
  }, [query, nodes]);

  const handleSelect = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setFocusedNodeId(nodeId);
    setActiveFocusPath(nodeId, visualizationData);
    setQuery('');
  };

  return (
    <div className={cn('relative', className)}>
      <Input
        type="text"
        placeholder="Search nodes..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
      />
      {query && suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-md border bg-popover text-sm shadow">
          {suggestions.map((node) => (
            <li
              key={node.id}
              className="cursor-pointer px-2 py-1 hover:bg-accent"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(node.id);
              }}
            >
              {node.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchNodes;
