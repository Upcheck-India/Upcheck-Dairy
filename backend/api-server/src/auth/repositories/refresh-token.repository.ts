import { Injectable, Inject } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import { refreshTokens, type RefreshToken, type InsertRefreshToken } from "@workspace/db";
import { eq, and, gt, isNull } from "drizzle-orm";

@Injectable()
export class RefreshTokenRepository {
  constructor(@Inject(DatabaseService) private dbService: DatabaseService) {}

  async findActiveTokensForUser(userId: string): Promise<RefreshToken[]> {
    return this.dbService.drizzle
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.userId, userId),
          gt(refreshTokens.expiresAt, new Date()),
          isNull(refreshTokens.revokedAt)
        )
      );
  }

  async create(data: InsertRefreshToken): Promise<RefreshToken> {
    const results = await this.dbService.drizzle
      .insert(refreshTokens)
      .values(data)
      .returning();
    return results[0];
  }

  async revoke(id: number): Promise<void> {
    await this.dbService.drizzle
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.id, id));
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.dbService.drizzle
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.userId, userId));
  }
}
