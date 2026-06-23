import { Injectable, OnModuleDestroy, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@workspace/db";

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  public readonly drizzle: NodePgDatabase<typeof schema>;
  private readonly pool: pg.Pool;

  constructor(@Inject(ConfigService) private configService: ConfigService) {
    const connectionString = this.configService.get<string>("DATABASE_URL");
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not set!");
    }
    this.pool = new pg.Pool({ connectionString });
    this.drizzle = drizzle(this.pool, { schema });
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
