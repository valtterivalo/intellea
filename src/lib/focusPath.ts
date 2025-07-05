/**
 * @fileoverview Utility to compute focused path through graph.
 * Exports calculateFocusPath.
 */
import type { GraphData } from '@/store/useAppStore';

export const calculateFocusPath = (
  nodeId: string,
  vizData: GraphData
): { focusPathIds: Set<string> | null } => {
  if (!nodeId || !vizData || !vizData.nodes || !vizData.links) {
    return { focusPathIds: null };
  }

  const focusPathIds = new Set<string>([nodeId]);
  const links = vizData.links;

  links.forEach((link) => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;

    if (sourceId === nodeId && targetId) {
      focusPathIds.add(targetId as string);
    } else if (targetId === nodeId && sourceId) {
      focusPathIds.add(sourceId as string);
    }
  });

  const rootNode = vizData.nodes.find((n) => n.isRoot === true);
  if (rootNode) {
    focusPathIds.add(rootNode.id);
  }

  return { focusPathIds };
};
