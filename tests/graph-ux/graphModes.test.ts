import { describe, it, expect } from 'vitest';
import { applyGraphModeOverride, buildModeVariants } from '@/lib/graphModes';
import type { GraphResponseV0 } from '@intellea/graph-schema';

const baseResponse: GraphResponseV0 = {
  version: 'v0',
  mode: 'map',
  nodes: [{ id: 'root', label: 'Root', type: 'entity' }],
  edges: [],
};

describe('graph mode helpers', () => {
  it('applies mode overrides without mutating input', () => {
    const result = applyGraphModeOverride(baseResponse, 'decision');
    expect(result.mode).toBe('decision');
    expect(baseResponse.mode).toBe('map');
  });

  it('keeps the response when override is null', () => {
    const result = applyGraphModeOverride(baseResponse, null);
    expect(result).toBe(baseResponse);
  });

  it('builds all mode variants with label density override', () => {
    const variants = buildModeVariants(baseResponse, 'low');
    expect(variants).toHaveLength(4);
    expect(variants.map((v) => v.mode)).toEqual(['map', 'decision', 'plan', 'argument']);
    expect(variants.every((v) => v.response.view?.labelDensity === 'low')).toBe(true);
  });
});
