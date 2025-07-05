/**
 * @fileoverview Library utilities.
 * Exports: acquireLock, getCachedExpandedConcept, getGraphHash, getLockTTL, releaseLock, setCachedExpandedConcept
 */
import { createClient as createRedisClient } from './redis';
import crypto from 'crypto';

export function getGraphHash(data: unknown): string {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex');
}

function getCacheKey(sessionId: string, graphHash: string): string {
  return `expand:${sessionId}:${graphHash}`;
}

function getLockKey(sessionId: string, graphHash: string): string {
  return `lock:${sessionId}:${graphHash}`;
}

export async function getCachedExpandedConcept(sessionId: string, graphHash: string) {
  const redis = createRedisClient();
  const cacheKey = getCacheKey(sessionId, graphHash);
  const cached = await redis.get(cacheKey);
  if (!cached || typeof cached !== 'string') return null;
  try {
    return JSON.parse(cached);
  } catch {
    return null;
  }
}

export async function setCachedExpandedConcept(sessionId: string, graphHash: string, data: unknown, ttlSeconds = 60 * 60 * 24) {
  const redis = createRedisClient();
  const cacheKey = getCacheKey(sessionId, graphHash);
  await redis.set(cacheKey, JSON.stringify(data), { ex: ttlSeconds });
}

export async function acquireLock(sessionId: string, graphHash: string, ttlSeconds = 300): Promise<boolean> {
  const redis = createRedisClient();
  const lockKey = getLockKey(sessionId, graphHash);
  try {
    // Upstash Redis API
    const result = await redis.set(lockKey, '1', { nx: true, ex: ttlSeconds });
    return !!result;
  } catch {
    // Fallback for mocks lacking full option support
    const exists = await redis.exists(lockKey);
    if (exists) return false;
    await redis.set(lockKey, '1');
    await redis.expire(lockKey, ttlSeconds);
    return true;
  }
}

export async function getLockTTL(sessionId: string, graphHash: string): Promise<number> {
  const redis = createRedisClient();
  const lockKey = getLockKey(sessionId, graphHash);
  return await redis.ttl(lockKey);
}

export async function releaseLock(sessionId: string, graphHash: string) {
  const redis = createRedisClient();
  const lockKey = getLockKey(sessionId, graphHash);
  await redis.del(lockKey);
}
