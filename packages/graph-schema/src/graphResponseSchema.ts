/**
 * @fileoverview Zod validation for GraphResponseV0.
 * Exports: GraphResponseV0Schema, validateGraphResponseV0
 */

import { z } from 'zod';

export const GraphModeV0Schema = z.enum(['map', 'decision', 'plan', 'argument']);
export const GraphNodeTypeV0Schema = z.enum([
  'entity',
  'claim',
  'action',
  'option',
  'constraint',
  'evidence',
  'risk',
  'question',
]);
export const GraphEdgeTypeV0Schema = z.enum([
  'supports',
  'contradicts',
  'depends_on',
  'causes',
  'risks',
  'mitigates',
  'relates_to',
]);
export const GraphLabelDensityV0Schema = z.enum(['low', 'medium', 'high']);

export const GraphPositionV0Schema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number().optional(),
  isFixed: z.boolean().optional(),
});

export const GraphTimeRangeV0Schema = z.object({
  start: z.string().optional(),
  end: z.string().optional(),
});

export const GraphNodeV0Schema = z.object({
  id: z.string(),
  label: z.string(),
  type: GraphNodeTypeV0Schema,
  summary: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  timeRange: GraphTimeRangeV0Schema.optional(),
  sourceIds: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  position: GraphPositionV0Schema.optional(),
  meta: z.record(z.unknown()).optional(),
});

export const GraphEdgeV0Schema = z.object({
  id: z.string().optional(),
  source: z.string(),
  target: z.string(),
  type: GraphEdgeTypeV0Schema,
  label: z.string().optional(),
  weight: z.number().min(0).max(1).optional(),
  meta: z.record(z.unknown()).optional(),
});

export const GraphLayoutHintV0Schema = z.object({
  algorithm: z.enum(['umap', 'force', 'radial', 'grid']),
  dimensions: z.union([z.literal(2), z.literal(3)]),
  nodeSpacing: z.number().optional(),
  isDeterministic: z.boolean().optional(),
});

export const GraphViewHintV0Schema = z.object({
  labelDensity: GraphLabelDensityV0Schema.optional(),
  defaultFocusNodeId: z.string().optional(),
  emphasisNodeIds: z.array(z.string()).optional(),
  emphasisEdgeTypes: z.array(GraphEdgeTypeV0Schema).optional(),
  showLegend: z.boolean().optional(),
});

export const GraphResponseV0Schema = z.object({
  version: z.literal('v0'),
  mode: GraphModeV0Schema,
  nodes: z.array(GraphNodeV0Schema),
  edges: z.array(GraphEdgeV0Schema),
  layout: GraphLayoutHintV0Schema.optional(),
  view: GraphViewHintV0Schema.optional(),
  meta: z.record(z.unknown()).optional(),
});

/**
 * @description Validate a GraphResponseV0 payload and return the parsed object.
 * @param payload - Candidate graph response.
 */
export const validateGraphResponseV0 = (payload: unknown) =>
  GraphResponseV0Schema.parse(payload);
