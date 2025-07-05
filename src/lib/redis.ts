import { Redis } from '@upstash/redis';

let client: Redis | null = null;

/**
 * @description Create or return a cached Upstash Redis client.
 * @returns A singleton Redis client instance.
 */
export function createClient(): Redis {
  if (!client) {
    // Use Upstash's fromEnv() method which reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
    client = Redis.fromEnv();
  }
  return client;
}
