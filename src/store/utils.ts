/**
 * @fileoverview Zustand store slice.
 * Exports: isIntelleaResponse, isLoadedSessionData
 */
import type { IntelleaResponse, LoadedSessionData } from './useAppStore';

/**
 * @description Type guard to determine if a value is an `IntelleaResponse`.
 * @param obj - Value to test.
 * @returns True when `obj` conforms to `IntelleaResponse`.
 */
export function isIntelleaResponse(obj: unknown): obj is IntelleaResponse {
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

/**
 * @description Type guard for `LoadedSessionData` objects.
 * @param obj - Value to test.
 * @returns True when `obj` is `LoadedSessionData`.
 */
export function isLoadedSessionData(obj: unknown): obj is LoadedSessionData {
  return isIntelleaResponse(obj);
}
