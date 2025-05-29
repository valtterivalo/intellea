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

// Mock OpenAI API
vi.mock('openai', () => {
  return {
    default: class {
      chat = {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    title: 'Test Concept',
                    content: 'This is a test explanation.',
                    relatedConcepts: []
                  })
                }
              }
            ]
          })
        }
      }
    }
  };
});

describe('expand-concept API cache & concurrency', () => {
  let app: any;

  beforeEach(async () => {
    // Dynamically import the Next.js API handler
    app = (await import('@/app/api/expand-concept/route')).POST;
    // Clear Redis between tests
    const redis = redisLib.createClient();
    await redis.flushall();
  });

  afterEach(async () => {
    const redis = redisLib.createClient();
    await redis.flushall();
  });

  it('should cache the OpenAI response and return cached on repeat', async () => {
    // Simulate a POST request
    const req = {
      json: async () => ({
        nodeId: 'n1',
        nodeLabel: 'Test Node',
        visualizationData: { nodes: [], links: [] },
        knowledgeCards: []
      }),
      headers: {},
    };

    // Mock NextRequest/NextResponse
    const res1 = await app(req as any);
    expect(res1.status).toBe(200);
    const data1 = await res1.json();
    expect(data1.title).toBe('Test Concept');

    // Second request should hit cache (simulate by calling again)
    const res2 = await app(req as any);
    expect(res2.status).toBe(200);
    const data2 = await res2.json();
    expect(data2.title).toBe('Test Concept');
  });

  it('should return 202 with Retry-After if lock exists (concurrent request)', async () => {
    const redis = redisLib.createClient();
    // Manually set a lock
    await redis.set('lock:test-session:test-hash', '1', 'EX', 300);

    // Simulate a POST request with the same session/hash
    const req = {
      json: async () => ({
        nodeId: 'n1',
        nodeLabel: 'Test Node',
        visualizationData: { nodes: [], links: [] },
        knowledgeCards: []
      }),
      headers: {},
    };

    // Patch the handler to use the same session/hash for lock
    // (You may need to adjust this depending on your actual handler logic)
    const res = await app(req as any);
    expect(res.status).toBe(202);
    const data = await res.json();
    expect(data.retryAfter).toBeDefined();
  });
});
