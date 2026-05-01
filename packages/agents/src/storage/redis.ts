import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env["UPSTASH_REDIS_REST_URL"] ?? "",
  token: process.env["UPSTASH_REDIS_REST_TOKEN"] ?? "",
});

export const redisClient = {
  get: async (key: string): Promise<string | null> => {
    return redis.get<string>(key);
  },
  set: async (key: string, value: string): Promise<void> => {
    await redis.set(key, value);
  },
  lpush: async (key: string, value: string): Promise<void> => {
    await redis.lpush(key, value);
  },
};
