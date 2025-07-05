'use client';

import { useState } from 'react';
import { useAppStore, IntelleaResponse, NodeObject } from '@/store/useAppStore';
import { createClient } from '@/lib/supabase/client';

export function useNodeExpansion() {
  const supabase = createClient();
  const [localExpandingNodeId, setLocalExpandingNodeId] = useState<string | null>(null);
  const subscriptionStatus = useAppStore(state => state.subscriptionStatus);
  const setError = useAppStore(state => state.setError);
  const addGraphExpansion = useAppStore(state => state.addGraphExpansion);
  const isLoading = useAppStore(state => state.isLoading);

  const handleNodeExpand = async (nodeId: string, nodeLabel: string) => {
    if (isLoading || localExpandingNodeId) return;
    if (subscriptionStatus !== 'active') {
      setError('You need an active subscription to expand the graph.');
      return;
    }
    if (process.env.NEXT_PUBLIC_DEBUG === 'true')
      console.log(`Expanding node: ID=${nodeId}, Label="${nodeLabel}"`);

    setLocalExpandingNodeId(nodeId);
    setError(null);

    const currentOutput = useAppStore.getState().output;
    let currentGraphData = null;
    if (
      typeof currentOutput === 'object' &&
      currentOutput !== null &&
      'visualizationData' in currentOutput &&
      currentOutput.visualizationData
    ) {
      currentGraphData = currentOutput.visualizationData;
    } else {
      console.error('Cannot expand node: Current output is invalid or missing visualizationData.');
      setError('Cannot expand graph: visualization data is missing.');
      setLocalExpandingNodeId(null);
      return;
    }

    const cleanedNodes = currentGraphData.nodes.map(({ id, label, fx, fy, fz, isRoot }) => ({
      id,
      label,
      fx,
      fy,
      fz,
      isRoot,
    }));
    const cleanedLinks = currentGraphData.links.map(({ source, target }) => ({
      source: typeof source === 'object' && source !== null ? (source as NodeObject).id : (source as string),
      target: typeof target === 'object' && target !== null ? (target as NodeObject).id : (target as string),
    }));
    const cleanedVisualizationData = { nodes: cleanedNodes, links: cleanedLinks };

    const currentKnowledgeCards =
      typeof currentOutput === 'object' &&
      currentOutput !== null &&
      'knowledgeCards' in currentOutput &&
      currentOutput.knowledgeCards
        ? currentOutput.knowledgeCards
        : [];

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId,
          nodeLabel,
          currentVisualizationData: cleanedVisualizationData,
          currentKnowledgeCards: currentKnowledgeCards,
        }),
      });
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          /* ignore */
        }
        throw new Error(errorData?.error || `HTTP error! status: ${response.status} - ${response.statusText}`);
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      if (data && data.updatedVisualizationData && data.newKnowledgeCards) {
        addGraphExpansion(data, nodeId, supabase);
        if (process.env.NEXT_PUBLIC_DEBUG === 'true')
          console.log('Expansion successful, data processed by store.');
      } else {
        if (process.env.NEXT_PUBLIC_DEBUG === 'true')
          console.log('Expansion API returned an unexpected response structure or no new data.');
      }
    } catch (error) {
      console.error('Failed to fetch or process graph expansion:', error);
      const message = `Expansion Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setError(message);
    } finally {
      setLocalExpandingNodeId(null);
    }
  };

  return { handleNodeExpand, localExpandingNodeId };
}
