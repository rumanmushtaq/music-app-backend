import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

import { buildRedisConfig } from '../config/redis.config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor() {
    const config = buildRedisConfig();
    // lazyConnect defers the actual connection attempt to onModuleInit, so a failed/slow
    // connection can be caught and logged there instead of throwing during app bootstrap.
    this.client =
      typeof config === 'string' ? new Redis(config, { lazyConnect: true }) : new Redis({ ...config, lazyConnect: true });

    // A cache is an optimization, not a dependency - a Redis outage should degrade the API to
    // uncached (slower) reads, never take it down. Every helper below fails open around this.
    this.client.on('error', (error) => {
      this.logger.warn(`Redis connection error: ${error.message}`);
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.client.connect();
    } catch (error) {
      this.logger.warn(`Redis unavailable at startup, continuing without cache: ${(error as Error).message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.client.disconnect();
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.client.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (error) {
      this.logger.warn(`Redis GET failed for key "${key}": ${(error as Error).message}`);
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error) {
      this.logger.warn(`Redis SET failed for key "${key}": ${(error as Error).message}`);
    }
  }

  async del(...keys: string[]): Promise<void> {
    if (!keys.length) return;
    try {
      await this.client.del(...keys);
    } catch (error) {
      this.logger.warn(`Redis DEL failed for keys "${keys.join(', ')}": ${(error as Error).message}`);
    }
  }

  async delByPrefix(prefix: string): Promise<void> {
    try {
      const keys = await this.client.keys(`${prefix}*`);
      if (keys.length) {
        await this.client.del(...keys);
      }
    } catch (error) {
      this.logger.warn(`Redis DEL by prefix "${prefix}" failed: ${(error as Error).message}`);
    }
  }

  /**
   * Returns the cached value for `key` if present; otherwise calls `factory`, caches its
   * result for `ttlSeconds`, and returns it. On any Redis failure, falls through to calling
   * `factory` uncached rather than rejecting.
   */
  async getOrSet<T>(key: string, ttlSeconds: number, factory: () => Promise<T> | T): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttlSeconds);
    return value;
  }
}
