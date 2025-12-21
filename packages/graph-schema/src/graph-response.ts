/**
 * @fileoverview Graph response schema types for the embeddable renderer.
 * Exports: GraphResponseV0, GraphNodeV0, GraphEdgeV0, GraphModeV0, GraphLayoutHintV0
 */

export type GraphModeV0 = 'map' | 'decision' | 'plan' | 'argument';

export type GraphNodeTypeV0 =
  | 'entity'
  | 'claim'
  | 'action'
  | 'option'
  | 'constraint'
  | 'evidence'
  | 'risk'
  | 'question';

export type GraphEdgeTypeV0 =
  | 'supports'
  | 'contradicts'
  | 'depends_on'
  | 'causes'
  | 'risks'
  | 'mitigates'
  | 'relates_to';

export type GraphLabelDensityV0 = 'low' | 'medium' | 'high';

export interface GraphPositionV0 {
  x: number;
  y: number;
  z?: number;
  isFixed?: boolean;
}

export interface GraphTimeRangeV0 {
  start?: string;
  end?: string;
}

export interface GraphNodeV0 {
  id: string;
  label: string;
  type: GraphNodeTypeV0;
  summary?: string;
  confidence?: number;
  timeRange?: GraphTimeRangeV0;
  sourceIds?: string[];
  tags?: string[];
  position?: GraphPositionV0;
  meta?: Record<string, unknown>;
}

export interface GraphEdgeV0 {
  id?: string;
  source: string;
  target: string;
  type: GraphEdgeTypeV0;
  label?: string;
  weight?: number;
  meta?: Record<string, unknown>;
}

export interface GraphLayoutHintV0 {
  algorithm: 'umap' | 'force' | 'radial' | 'grid';
  dimensions: 2 | 3;
  nodeSpacing?: number;
  isDeterministic?: boolean;
}

export interface GraphViewHintV0 {
  labelDensity?: GraphLabelDensityV0;
  defaultFocusNodeId?: string;
  emphasisNodeIds?: string[];
  emphasisEdgeTypes?: GraphEdgeTypeV0[];
  showLegend?: boolean;
}

export interface GraphResponseV0 {
  version: 'v0';
  mode: GraphModeV0;
  nodes: GraphNodeV0[];
  edges: GraphEdgeV0[];
  layout?: GraphLayoutHintV0;
  view?: GraphViewHintV0;
  meta?: Record<string, unknown>;
}
