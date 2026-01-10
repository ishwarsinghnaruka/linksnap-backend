import redisClient from "../config/redis";

export class CacheService {
  private ttl: number;

  constructor() {
    this.ttl = parseInt(process.env.REDIS_TTL || "3600"); // 1 hour default
  }

  /**
   * Get value from cache
   */
  async get(key: string): Promise<string | null> {
    try {
      const value = await redisClient.get(key);
      return value;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      await redisClient.setEx(key, ttl || this.ttl, value);
    } catch (error) {
      console.error("Cache set error:", error);
    }
  }

  /**
   * Delete key from cache
   */
  async delete(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (error) {
      console.error("Cache delete error:", error);
    }
  }

  /**
   * Delete multiple keys matching pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      console.error("Cache delete pattern error:", error);
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      console.error("Cache exists error:", error);
      return false;
    }
  }

  /**
   * Clear all cache
   */
  async flush(): Promise<void> {
    try {
      await redisClient.flushAll();
    } catch (error) {
      console.error("Cache flush error:", error);
    }
  }
}
