// @vitest-environment node
process.env.OPENAI_API_KEY = 'dummy-test-key';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://dummy.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'dummy-anon-key';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import * as redisLib from '@/lib/redis';

// Mock Redis client to use ioredis-mock
vi.mock('@/lib/redis', () => {
  const RedisMock = require('ioredis-mock');
  let client: any = null;
  return {
    createClient: () => {
      if (!client) {
        client = new RedisMock();
      }
      return client;
    }
  };
});

// Mock OpenAI Agents SDK with streaming support
vi.mock('@openai/agents', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    Agent: vi.fn().mockImplementation(() => ({})),
    run: vi.fn().mockImplementation(async (agent, input, options) => {
      if (options?.stream) {
        // Mock streaming response
        const textChunks = [
          '# Test Concept\n\n',
          'This is a streaming ',
          'explanation of the concept.\n\n',
          '## Key Points\n\n',
          '- Point 1\n',
          '- Point 2\n',
          '- Point 3\n'
        ];
        
        let currentIndex = 0;
        
        const mockStream = {
          async *toTextStream() {
            for (const chunk of textChunks) {
              yield chunk;
            }
          },
          
          get completed() {
            return Promise.resolve();
          },
          
          get finalOutput() {
            return {
              title: 'Test Concept',
              content: '# Test Concept\n\nThis is a streaming explanation of the concept.\n\n## Key Points\n\n- Point 1\n- Point 2\n- Point 3\n',
              relatedConcepts: [
                {
                  nodeId: 'related-1',
                  title: 'Related Concept',
                  relation: 'builds upon'
                }
              ]
            };
          }
        };
        
        return mockStream;
      } else {
        // Non-streaming response
        return {
          finalOutput: {
            title: 'Test Concept',
            content: 'This is a non-streaming explanation.',
            relatedConcepts: []
          }
        };
      }
    })
  };
});

describe('Concept Expansion Streaming', () => {
  let streamHandler: any;

  beforeEach(async () => {
    // Dynamically import the streaming API handler
    streamHandler = (await import('@/app/api/expand-concept/stream/route')).POST;
    // Clear Redis between tests
    const redis = redisLib.createClient();
    await redis.flushall();
  });

  afterEach(async () => {
    const redis = redisLib.createClient();
    await redis.flushall();
  });

  it('should stream text chunks incrementally', async () => {
    const req = {
      json: async () => ({
        nodeId: 'test-node',
        nodeLabel: 'Test Node',
        visualizationData: { nodes: [], links: [] },
        knowledgeCards: []
      })
    };

    const response = await streamHandler(req as any);
    expect(response).toBeInstanceOf(Response);
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');

    // Read the stream
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    if (!reader) {
      throw new Error('No reader available');
    }

    const chunks: string[] = [];
    let finalData: any = null;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const eventData = JSON.parse(line.slice(6));
            
            if (eventData.type === 'chunk') {
              chunks.push(eventData.content);
            } else if (eventData.type === 'complete') {
              finalData = eventData.data;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    // Verify streaming behavior
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks.join('')).toContain('Test Concept');
    expect(chunks.join('')).toContain('streaming explanation');
    
    // Verify final structured data
    expect(finalData).toBeDefined();
    expect(finalData.title).toBe('Test Concept');
    expect(finalData.content).toContain('streaming explanation');
    expect(finalData.relatedConcepts).toHaveLength(1);
    expect(finalData.relatedConcepts[0].nodeId).toBe('related-1');
  });

  it('should return cached data immediately if available', async () => {
    // First, manually cache some data
    const redis = redisLib.createClient();
    const cachedData = {
      title: 'Cached Concept',
      content: 'This is cached content.',
      relatedConcepts: []
    };
    
    await redis.set(
      'concept:test-session:test-hash',
      JSON.stringify(cachedData),
      'EX',
      3600
    );

    const req = {
      json: async () => ({
        nodeId: 'test-node',
        nodeLabel: 'Test Node',
        visualizationData: { nodes: [], links: [] },
        knowledgeCards: []
      })
    };

    const response = await streamHandler(req as any);
    expect(response).toBeInstanceOf(Response);

    // Read the stream - should get immediate complete event
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    if (!reader) {
      throw new Error('No reader available');
    }

    let completeData: any = null;
    let chunkCount = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const eventData = JSON.parse(line.slice(6));
            
            if (eventData.type === 'chunk') {
              chunkCount++;
            } else if (eventData.type === 'complete') {
              completeData = eventData.data;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    // Should get cached data immediately without streaming chunks
    expect(chunkCount).toBe(0);
    expect(completeData).toBeDefined();
    expect(completeData.title).toBe('Cached Concept');
  });

  it('should handle concurrent requests with lock mechanism', async () => {
    // Set up a lock
    const redis = redisLib.createClient();
    await redis.set('lock:test-session:test-hash', '1', 'EX', 300);

    const req = {
      json: async () => ({
        nodeId: 'test-node',
        nodeLabel: 'Test Node',
        visualizationData: { nodes: [], links: [] },
        knowledgeCards: []
      })
    };

    const response = await streamHandler(req as any);
    expect(response.status).toBe(202);
    expect(response.headers.get('Retry-After')).toBeDefined();

    // Read the stream - should get error event
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    if (!reader) {
      throw new Error('No reader available');
    }

    let errorReceived = false;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const eventData = JSON.parse(line.slice(6));
            
            if (eventData.type === 'error') {
              errorReceived = true;
              expect(eventData.error).toContain('Request in progress');
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    expect(errorReceived).toBe(true);
  });
});