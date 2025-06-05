import type { IntelleaResponse } from './useAppStore';

export function isIntelleaResponse(obj: any): obj is IntelleaResponse {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'explanationMarkdown' in obj &&
    'knowledgeCards' in obj &&
    (obj.knowledgeCards === null || Array.isArray(obj.knowledgeCards)) &&
    'visualizationData' in obj &&
    typeof obj.visualizationData === 'object' &&
    obj.visualizationData !== null &&
    'nodes' in obj.visualizationData &&
    Array.isArray(obj.visualizationData.nodes) &&
    'links' in obj.visualizationData &&
    Array.isArray(obj.visualizationData.links)
  );
}
