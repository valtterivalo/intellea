/**
 * @fileoverview Shared graph data types for renderer inputs.
 * Exports: NodeObject, LinkObject, GraphData
 */

export interface NodeObject {
  id: string;
  label: string;
  isRoot?: boolean;
  fx?: number;
  fy?: number;
  fz?: number;
  x?: number;
  y?: number;
  z?: number;
  [key: string]: unknown;
}

export interface LinkObject {
  source: string | NodeObject;
  target: string | NodeObject;
  [key: string]: unknown;
}

export interface GraphData {
  nodes: NodeObject[];
  links: LinkObject[];
}
