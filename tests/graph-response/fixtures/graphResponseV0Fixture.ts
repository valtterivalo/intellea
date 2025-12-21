/**
 * @fileoverview Fixture data for GraphResponseV0 validation tests.
 * Exports: graphResponseV0Fixture
 */

import type { GraphResponseV0 } from '@intellea/graph-schema';

export const graphResponseV0Fixture: GraphResponseV0 = {
  version: 'v0',
  mode: 'decision',
  nodes: [
    {
      id: 'root',
      label: 'expand into nordic markets',
      type: 'claim',
      summary: 'evaluate expansion paths for a new region',
      confidence: 0.62,
      tags: ['strategy'],
      position: { x: 0, y: 0, z: 0, isFixed: true },
    },
    {
      id: 'option-a',
      label: 'enter through partnerships',
      type: 'option',
      confidence: 0.71,
      position: { x: 120, y: 40, z: -30 },
    },
    {
      id: 'option-b',
      label: 'open direct sales office',
      type: 'option',
      confidence: 0.48,
      position: { x: -110, y: -20, z: 45 },
    },
    {
      id: 'risk-regulatory',
      label: 'regulatory approval delays',
      type: 'risk',
      timeRange: { start: '2025-01-01' },
      position: { x: 40, y: 90, z: 60 },
    },
  ],
  edges: [
    {
      source: 'root',
      target: 'option-a',
      type: 'supports',
      weight: 0.7,
    },
    {
      source: 'root',
      target: 'option-b',
      type: 'supports',
      weight: 0.5,
    },
    {
      source: 'risk-regulatory',
      target: 'option-b',
      type: 'risks',
      weight: 0.6,
    },
  ],
  layout: {
    algorithm: 'umap',
    dimensions: 3,
    nodeSpacing: 140,
    isDeterministic: true,
  },
  view: {
    labelDensity: 'medium',
    defaultFocusNodeId: 'root',
    emphasisNodeIds: ['root', 'option-a', 'option-b'],
    emphasisEdgeTypes: ['supports'],
    showLegend: true,
  },
  meta: {
    source: 'fixture',
  },
};
