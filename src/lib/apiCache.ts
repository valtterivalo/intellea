/**
 * @fileoverview Library utilities.
 * Exports: acquireLock, getCachedExpandedConcept, getGraphHash, getLockTTL, releaseLock, setCachedExpandedConcept
 */
import { createClient as createRedisClient } from './redis';
import crypto from 'crypto';

/**
 * @description Generate a SHA-256 hash of the provided data.
 * @param data - Graph data to hash.
 * @returns Hexadecimal hash string.
 */
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

/**
 * @description Retrieve expanded concept data from Redis cache.
 * @returns Parsed cached data or null.
 */
export async function getCachedExpandedConcept(sessionId: string, graphHash: string) {
  try {
    const redis = createRedisClient();
    const cacheKey = getCacheKey(sessionId, graphHash);
    const cached = await redis.get(cacheKey);
    if (!cached || typeof cached !== 'string') return null;
    return JSON.parse(cached);
  } catch (error) {
    if (process.env.APP_DEBUG === 'true') console.log('Redis unavailable, skipping cache lookup:', error);
    return null;
  }
}

/**
 * @description Store expanded concept data in Redis.
 * @param ttlSeconds - Cache lifetime in seconds.
 */
export async function setCachedExpandedConcept(sessionId: string, graphHash: string, data: unknown, ttlSeconds = 60 * 60 * 24) {
  try {
    const redis = createRedisClient();
    const cacheKey = getCacheKey(sessionId, graphHash);
    // Handle both ioredis and Upstash Redis APIs
    if ('setex' in redis) {
      // ioredis API
      await (redis as { setex: (key: string, seconds: number, value: string) => Promise<unknown> }).setex(cacheKey, ttlSeconds, JSON.stringify(data));
    } else {
      // Upstash Redis API  
      await (redis as { set: (key: string, value: string, options?: { ex?: number }) => Promise<unknown> }).set(cacheKey, JSON.stringify(data), { ex: ttlSeconds });
    }
  } catch (error) {
    if (process.env.APP_DEBUG === 'true') console.log('Redis unavailable, skipping cache set:', error);
  }
}

/**
 * @description Acquire a Redis lock for a graph expansion.
 * @param ttlSeconds - Lock lifetime in seconds.
 * @returns `true` if the lock was acquired.
 */
export async function acquireLock(sessionId: string, graphHash: string, ttlSeconds = 300): Promise<boolean> {
  try {
    const redis = createRedisClient();
    const lockKey = getLockKey(sessionId, graphHash);
    // Handle both ioredis and Upstash Redis APIs
    if ('setnx' in redis) {
      // ioredis API
      const result = await (redis as { set: (key: string, value: string, mode: string, duration: number, flag: string) => Promise<string | null> }).set(lockKey, '1', 'EX', ttlSeconds, 'NX');
      return result === 'OK';
    } else {
      // Upstash Redis API
      try {
        const result = await (redis as { set: (key: string, value: string, options?: { nx?: boolean; ex?: number }) => Promise<string | null> }).set(lockKey, '1', { nx: true, ex: ttlSeconds });
        return !!result;
      } catch {
        // Fallback for mocks lacking full option support
        const exists = await (redis as { exists: (key: string) => Promise<number> }).exists(lockKey);
        if (exists) return false;
        await (redis as { set: (key: string, value: string) => Promise<unknown> }).set(lockKey, '1');
        await (redis as { expire: (key: string, seconds: number) => Promise<unknown> }).expire(lockKey, ttlSeconds);
        return true;
      }
    }
  } catch (error) {
    if (process.env.APP_DEBUG === 'true') console.log('Redis unavailable, skipping lock acquisition:', error);
    return true; // Allow processing to proceed without locking
  }
}

/**
 * @description Retrieve the remaining TTL for a lock key.
 * @returns TTL value in seconds.
 */
export async function getLockTTL(sessionId: string, graphHash: string): Promise<number> {
  try {
    const redis = createRedisClient();
    const lockKey = getLockKey(sessionId, graphHash);
    return await redis.ttl(lockKey);
  } catch (error) {
    if (process.env.APP_DEBUG === 'true') console.log('Redis unavailable, returning default TTL:', error);
    return 60; // Default TTL when Redis is unavailable
  }
}

/**
 * @description Remove a lock key from Redis.
 */
export async function releaseLock(sessionId: string, graphHash: string) {
  try {
    const redis = createRedisClient();
    const lockKey = getLockKey(sessionId, graphHash);
    await redis.del(lockKey);
  } catch (error) {
    if (process.env.APP_DEBUG === 'true') console.log('Redis unavailable, skipping lock release:', error);
  }
}
