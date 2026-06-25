import { Injectable, OnModuleDestroy, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis | null = null;
  private memoryDb = new Map<string, { value: string; expiresAt?: number }>();
  private isEnabled = true;

  constructor(@Inject(ConfigService) private configService: ConfigService) {
    this.isEnabled = this.configService.get<string>("REDIS_ENABLED") !== "false";

    if (this.isEnabled) {
      const redisUrl = this.configService.get<string>("REDIS_URL") || "redis://localhost:6379";
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        retryStrategy: () => {
          // Fail fast and stop retrying to prevent connection log spam
          return null;
        },
      });
      
      // Catch connection errors to prevent unhandled exception stack traces
      this.client.on("error", () => {});
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.isEnabled) {
      const record = this.memoryDb.get(key);
      if (!record) return null;
      if (record.expiresAt && Date.now() > record.expiresAt) {
        this.memoryDb.delete(key);
        return null;
      }
      return record.value;
    }
    return this.client!.get(key);
  }

  async set(key: string, value: string, mode?: "EX", duration?: number): Promise<string> {
    if (!this.isEnabled) {
      const expiresAt = mode === "EX" && duration !== undefined ? Date.now() + duration * 1000 : undefined;
      this.memoryDb.set(key, { value, expiresAt });
      return "OK";
    }
    if (mode === "EX" && duration !== undefined) {
      return this.client!.set(key, value, "EX", duration);
    }
    return this.client!.set(key, value);
  }

  async del(key: string): Promise<number> {
    if (!this.isEnabled) {
      const existed = this.memoryDb.has(key);
      this.memoryDb.delete(key);
      return existed ? 1 : 0;
    }
    return this.client!.del(key);
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.disconnect();
    }
  }
}
