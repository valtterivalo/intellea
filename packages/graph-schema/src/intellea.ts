/**
 * @fileoverview Application file.
 * Exports: interface
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

export interface KnowledgeCard {
  nodeId: string;
  title: string;
  description: string;
}

export interface IntelleaResponse {
  sessionTitle?: string; // Optional for backward compatibility
  explanationMarkdown: string | null;
  knowledgeCards: KnowledgeCard[] | null;
  visualizationData: GraphData;
}

export interface ExpansionResponse {
  updatedVisualizationData: GraphData;
  newKnowledgeCards: KnowledgeCard[];
}

export interface ExpandedConceptData {
  title: string;
  content: string;
  relatedConcepts: Array<{
    nodeId: string;
    title: string;
    relation: string;
  }>;
}

export interface LoadedSessionData {
  explanationMarkdown: string | null;
  knowledgeCards: KnowledgeCard[] | null;
  visualizationData: GraphData;
}
