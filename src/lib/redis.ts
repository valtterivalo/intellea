import Redis from 'ioredis';

let client: Redis | null = null;

export function createClient(): Redis {
  if (!client) {
    const url = process.env.REDIS_URL;
    if (!url) {
      throw new Error('REDIS_URL environment variable is not set');
    }
    client = new Redis(url, {
      // Optionally, you can add more Redis options here
      // e.g., lazyConnect: true
    });

    client.on('error', (err) => {
      // Log connection errors but do not crash the app
      console.error('[Redis] Connection error:', err);
    });
  }
  return client;
}
