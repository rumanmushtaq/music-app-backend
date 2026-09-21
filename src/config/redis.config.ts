import type { RedisOptions } from 'ioredis';

export function buildRedisConfig(): string | RedisOptions {
  const url = process.env.REDIS_URL;
  if (url) {
    return url;
  }

  const host = process.env.REDIS_HOST ?? 'localhost';
  const isLocal = host === 'localhost' || host === '127.0.0.1';

  return {
    host,
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    // Upstash's standard-protocol endpoint requires TLS; a local redis-stack container doesn't use it.
    ...(isLocal ? {} : { tls: {} }),
  };
}
