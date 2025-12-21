/**
 * @fileoverview Tests for GraphResponseV0 validation.
 */

import { describe, it, expect } from 'vitest';
import { GraphResponseV0Schema } from '@intellea/graph-schema';
import { graphResponseV0Fixture } from './fixtures/graphResponseV0Fixture';

describe('GraphResponseV0Schema', () => {
  it('accepts a valid graph response', () => {
    const parsed = GraphResponseV0Schema.parse(graphResponseV0Fixture);
    expect(parsed.version).toBe('v0');
    expect(parsed.nodes).toHaveLength(graphResponseV0Fixture.nodes.length);
    expect(parsed.edges).toHaveLength(graphResponseV0Fixture.edges.length);
  });

  it('rejects missing required fields', () => {
    const invalidPayload = {
      version: 'v0',
      mode: 'map',
      edges: [],
    };
    expect(() => GraphResponseV0Schema.parse(invalidPayload)).toThrow();
  });
});
