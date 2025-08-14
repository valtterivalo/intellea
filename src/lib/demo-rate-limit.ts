/**
 * @fileoverview Rate limiting for demo sessions using IP address tracking.
 * Exports: checkDemoRateLimit
 */
import { NextRequest } from 'next/server';
import { createClient } from './redis';

const DEMO_LIMIT_DURATION = 60 * 60; // 1 hour in seconds
const DEMO_LIMIT_COUNT = 1; // 1 demo per IP per hour

/**
 * @description Check if IP address has exceeded demo rate limit.
 * @param req - Next.js request object to extract IP from.
 * @returns Promise<boolean> - true if rate limit exceeded, false if allowed.
 */
export async function checkDemoRateLimit(req: NextRequest): Promise<boolean> {
  try {
    const redis = createClient();
    
    // Get client IP address
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';
    
    const key = `demo_limit:${ip}`;
    
    // Check current count
    const current = await redis.get(key);
    
    if (current === null) {
      // First request from this IP
      await redis.setex(key, DEMO_LIMIT_DURATION, '1');
      return false; // Allow
    }
    
    const count = parseInt(current as string, 10);
    if (count >= DEMO_LIMIT_COUNT) {
      return true; // Rate limit exceeded
    }
    
    // Increment counter
    await redis.incr(key);
    return false; // Allow
    
  } catch (error) {
    console.error('Error checking demo rate limit:', error);
    // In case of Redis errors, allow the request to proceed
    return false;
  }
}