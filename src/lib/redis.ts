/**
 * @fileoverview Factory for Upstash Redis client.
 * Exports createClient.
 */
import { Redis } from '@upstash/redis';

let client: Redis | null = null;

export function createClient(): Redis {
  if (!client) {
    // Use Upstash's fromEnv() method which reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
    client = Redis.fromEnv();
  }
  return client;
}
