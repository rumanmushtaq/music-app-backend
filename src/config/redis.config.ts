import type { RedisOptions } from 'ioredis';

export function buildRedisConfig(): RedisOptions | string {
  const url = process.env.REDIS_URL;

  if (url) {
    return url;
  }

  return {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD || undefined,
  };
}
