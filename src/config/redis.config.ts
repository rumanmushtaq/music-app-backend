export type UpstashRedisConfig = {
  url: string;
  token: string;
};

export function buildRedisConfig(): UpstashRedisConfig | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  return { url, token };
}
