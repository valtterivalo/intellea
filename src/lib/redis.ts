/**
 * @fileoverview Redis client supporting both local and Upstash Redis.
 * Exports: createClient
 */
import { Redis as UpstashRedis } from '@upstash/redis';
import Redis from 'ioredis';

let client: Redis | UpstashRedis | null = null;

/**
 * @description Create or return a cached Redis client (local ioredis or Upstash).
 * @returns A singleton Redis client instance.
 */
export function createClient(): Redis | UpstashRedis {
  if (!client) {
    // Prefer local Redis for development
    if (process.env.REDIS_URL) {
      if (process.env.APP_DEBUG === 'true') console.log('Using local Redis:', process.env.REDIS_URL);
      client = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        lazyConnect: true, // Don't connect immediately
      });
    }
    // Fall back to Upstash for production
    else if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      if (process.env.APP_DEBUG === 'true') console.log('Using Upstash Redis');
      client = UpstashRedis.fromEnv();
    }
    else {
      throw new Error('No Redis configuration found. Set either REDIS_URL (local) or UPSTASH_REDIS_REST_* (production)');
    }
  }
  return client;
}
