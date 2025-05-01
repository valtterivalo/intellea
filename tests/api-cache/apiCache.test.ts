import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

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

import * as apiCache from '@/lib/apiCache';

describe('apiCache utility', () => {
  const sessionId = 'test-session';
  const graphData = { foo: 'bar', arr: [1, 2, 3] };
  let graphHash: string;

  beforeEach(() => {
    graphHash = apiCache.getGraphHash(graphData);
  });

  afterEach(async () => {
    // Clear Redis between tests
    const redis = (await import('@/lib/redis')).createClient();
    await redis.flushall();
  });

  it('generates consistent graph hash', () => {
    const hash1 = apiCache.getGraphHash(graphData);
    const hash2 = apiCache.getGraphHash(graphData);
    expect(hash1).toBe(hash2);
  });

  it('sets and gets cached expanded concept', async () => {
    const data = { title: 'Test', content: 'Hello', relatedConcepts: [] };
    await apiCache.setCachedExpandedConcept(sessionId, graphHash, data, 60);
    const cached = await apiCache.getCachedExpandedConcept(sessionId, graphHash);
    expect(cached).toEqual(data);
  });

  it('returns null for missing cache', async () => {
    const cached = await apiCache.getCachedExpandedConcept(sessionId, graphHash);
    expect(cached).toBeNull();
  });

  it('acquires and releases lock', async () => {
    const acquired = await apiCache.acquireLock(sessionId, graphHash, 10);
    expect(acquired).toBe(true);
    // Second acquire should fail
    const acquired2 = await apiCache.acquireLock(sessionId, graphHash, 10);
    expect(acquired2).toBe(false);
    // Release and try again
    await apiCache.releaseLock(sessionId, graphHash);
    const acquired3 = await apiCache.acquireLock(sessionId, graphHash, 10);
    expect(acquired3).toBe(true);
  });

  it('returns correct lock TTL', async () => {
    await apiCache.acquireLock(sessionId, graphHash, 5);
    const ttl = await apiCache.getLockTTL(sessionId, graphHash);
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(5);
  });
});
