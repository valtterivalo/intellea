/**
 * @fileoverview Stable layout helpers for incremental graph expansion.
 * Exports: applyStableExpansionLayout, shouldUseStableExpansionLayout
 */

import type { NodeObject } from '@intellea/graph-schema';

type Position = {
  x: number;
  y: number;
  z: number;
};

const hasPosition = (node: NodeObject): boolean =>
  typeof node.fx === 'number' ||
  typeof node.fy === 'number' ||
  typeof node.fz === 'number' ||
  typeof node.x === 'number' ||
  typeof node.y === 'number' ||
  typeof node.z === 'number';

const normalizePosition = (node: NodeObject): Position => ({
  x: typeof node.fx === 'number' ? node.fx : (node.x ?? 0),
  y: typeof node.fy === 'number' ? node.fy : (node.y ?? 0),
  z: typeof node.fz === 'number' ? node.fz : (node.z ?? 0),
});

const applyPosition = (node: NodeObject, position: Position): NodeObject => ({
  ...node,
  fx: position.x,
  fy: position.y,
  fz: position.z,
  x: position.x,
  y: position.y,
  z: position.z,
});

const hashString = (value: string): number => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
};

const goldenAngle = Math.PI * (3 - Math.sqrt(5));

const getAnchor = (existingNodes: NodeObject[], anchorNodeId?: string): Position => {
  const anchorNode = anchorNodeId
    ? existingNodes.find((node) => node.id === anchorNodeId)
    : existingNodes[0];
  if (!anchorNode) {
    return { x: 0, y: 0, z: 0 };
  }
  return normalizePosition(anchorNode);
};

const placeNodeAroundAnchor = (
  anchor: Position,
  index: number,
  nodeId: string,
  baseRadius: number,
  ringSpacing: number,
  ringSize: number
): Position => {
  const hash = hashString(nodeId);
  const ring = Math.floor(index / ringSize);
  const radius = baseRadius + ring * ringSpacing + (hash % 9);
  const angle = index * goldenAngle + (hash % 360) * (Math.PI / 180);
  const zOffset = ((hash % 13) - 6) * 1.5 + ring * 2;
  return {
    x: anchor.x + Math.cos(angle) * radius,
    y: anchor.y + Math.sin(angle) * radius,
    z: anchor.z + zOffset,
  };
};

export const shouldUseStableExpansionLayout = (
  existingNodes: NodeObject[],
  newNodes: NodeObject[]
): boolean => {
  if (newNodes.length === 0) return false;
  const totalNodes = existingNodes.length + newNodes.length;
  const ratio = newNodes.length / totalNodes;
  const hasExistingPositions = existingNodes.some((node) => hasPosition(node));
  if (!hasExistingPositions) return false;
  return newNodes.length <= 80 && ratio <= 0.2;
};

export const applyStableExpansionLayout = (
  existingNodes: NodeObject[],
  newNodes: NodeObject[],
  anchorNodeId?: string
): NodeObject[] => {
  const anchor = getAnchor(existingNodes, anchorNodeId);
  const baseRadius = 32;
  const ringSpacing = 18;
  const ringSize = 8;

  const normalizedExisting = existingNodes.map((node) =>
    hasPosition(node) ? applyPosition(node, normalizePosition(node)) : applyPosition(node, anchor)
  );

  const placedNewNodes = newNodes.map((node, index) => {
    if (hasPosition(node)) {
      return applyPosition(node, normalizePosition(node));
    }
    const position = placeNodeAroundAnchor(
      anchor,
      index,
      node.id,
      baseRadius,
      ringSpacing,
      ringSize
    );
    return applyPosition(node, position);
  });

  return [...normalizedExisting, ...placedNewNodes];
};
