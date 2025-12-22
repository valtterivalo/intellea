/**
 * @fileoverview MCP server that emits GraphResponseV0 payloads.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { markdownToGraphResponse } from '@intellea/graph-adapters';
const modeSchema = z.enum(['map', 'decision', 'plan', 'argument']);

const server = new McpServer({
  name: 'intellea-graph-response',
  version: '0.1.0',
});

server.registerTool(
  'graph_response_from_markdown',
  {
    title: 'Graph response from markdown',
    description: 'Convert markdown to GraphResponseV0 using the intellea adapter.',
    inputSchema: z.object({
      markdown: z.string().min(1),
      mode: modeSchema.optional(),
      maxNodes: z.number().int().min(10).max(2000).optional(),
    }),
  },
  async ({ markdown, mode, maxNodes }) => {
    const response = markdownToGraphResponse(markdown, {
      mode,
      maxNodes,
    });
    return {
      content: [{ type: 'text', text: JSON.stringify(response) }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
