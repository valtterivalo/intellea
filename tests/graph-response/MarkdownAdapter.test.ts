/**
 * @fileoverview Tests for markdownToGraphResponse adapter.
 */

import { describe, it, expect } from 'vitest';
import { markdownToGraphResponse } from '@/lib/adapters/markdownToGraphResponse';

describe('markdownToGraphResponse', () => {
  it('builds a graph from headings and lists', () => {
    const markdown = `
# Launch strategy

## Options
- Partner with local firms
- Open a sales office

## Risks
- Regulatory delays
`;

    const result = markdownToGraphResponse(markdown, { maxNodes: 20 });
    expect(result.nodes.length).toBeGreaterThanOrEqual(4);
    expect(result.edges.length).toBeGreaterThan(0);
    expect(result.view?.defaultFocusNodeId).toBeTruthy();
  });

  it('throws on empty input', () => {
    expect(() => markdownToGraphResponse('   ')).toThrow();
  });
});
