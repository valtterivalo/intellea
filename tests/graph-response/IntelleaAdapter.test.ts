/**
 * @fileoverview Tests for IntelleaResponse to GraphResponseV0 adapter.
 */

import { describe, it, expect } from 'vitest';
import { intelleaToGraphResponse } from '@/lib/adapters/intelleaToGraphResponse';
import type { IntelleaResponse } from '@intellea/graph-schema';

describe('intelleaToGraphResponse', () => {
  it('maps nodes, edges, and meta fields', () => {
    const payload: IntelleaResponse = {
      sessionTitle: 'Test Session',
      explanationMarkdown: 'Overview of the topic.',
      knowledgeCards: [
        { nodeId: 'root', title: 'Root', description: 'Root description.' },
        { nodeId: 'child', title: 'Child', description: 'Child description.' },
      ],
      visualizationData: {
        nodes: [
          { id: 'root', label: 'Root', isRoot: true, fx: 0, fy: 0, fz: 0 },
          { id: 'child', label: 'Child', isRoot: false, fx: 40, fy: 10, fz: -5 },
        ],
        links: [{ source: 'root', target: 'child' }],
      },
    };

    const result = intelleaToGraphResponse(payload);
    expect(result.version).toBe('v0');
    expect(result.mode).toBe('map');
    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(1);
    expect(result.meta?.source).toBe('intellea');
    expect(result.view?.defaultFocusNodeId).toBe('root');
  });
});
