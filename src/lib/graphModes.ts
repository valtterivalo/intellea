/**
 * @fileoverview Graph mode helpers for overrides and previews.
 * Exports: applyGraphModeOverride, buildModeVariants
 */

import type {
  GraphModeV0,
  GraphResponseV0,
  GraphLabelDensityV0,
  GraphViewHintV0,
} from '@intellea/graph-schema';

export const applyGraphModeOverride = (
  graphResponse: GraphResponseV0,
  override: GraphModeV0 | null
): GraphResponseV0 => {
  if (!override || override === graphResponse.mode) return graphResponse;
  return {
    ...graphResponse,
    mode: override,
  };
};

export const buildModeVariants = (
  graphResponse: GraphResponseV0,
  labelDensity: GraphLabelDensityV0 = 'low'
): Array<{ mode: GraphModeV0; response: GraphResponseV0 }> => {
  const modes: GraphModeV0[] = ['map', 'decision', 'plan', 'argument'];
  return modes.map((mode) => {
    const view: GraphViewHintV0 = {
      ...graphResponse.view,
      labelDensity,
    };
    return {
      mode,
      response: {
        ...graphResponse,
        mode,
        view,
      },
    };
  });
};
