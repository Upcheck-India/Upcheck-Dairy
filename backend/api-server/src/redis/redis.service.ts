import { Injectable, OnModuleDestroy, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;

  constructor(@Inject(ConfigService) private configService: ConfigService) {
    const redisUrl = this.configService.get<string>("REDIS_URL") || "redis://localhost:6379";
    this.client = new Redis(redisUrl);
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, mode?: "EX", duration?: number): Promise<string> {
    if (mode === "EX" && duration !== undefined) {
      return this.client.set(key, value, "EX", duration);
    }
    return this.client.set(key, value);
  }

  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  onModuleDestroy() {
    this.client.disconnect();
  }
}
