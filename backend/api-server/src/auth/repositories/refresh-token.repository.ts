import { Injectable, Inject } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import { refreshTokens, type RefreshToken, type InsertRefreshToken } from "@workspace/db";
import { eq, and, gt, isNull } from "drizzle-orm";

@Injectable()
export class RefreshTokenRepository {
  constructor(@Inject(DatabaseService) private dbService: DatabaseService) {}

  /** Find a live token by its indexed lookup key. */
  async findActiveByLookup(userId: string, tokenLookup: string): Promise<RefreshToken | null> {
    const results = await this.dbService.drizzle
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.userId, userId),
          eq(refreshTokens.tokenLookup, tokenLookup),
          gt(refreshTokens.expiresAt, new Date()),
          isNull(refreshTokens.revokedAt)
        )
      )
      .limit(1);
    return results[0] || null;
  }

  /**
   * Live tokens for a user that predate the lookup column.
   *
   * Only these need the bcrypt scan; anything issued since is found by index.
   * Once no rows with a null lookup remain, this returns nothing and the scan
   * costs a single indexed query.
   */
  async findActiveLegacyTokensForUser(userId: string): Promise<RefreshToken[]> {
    return this.dbService.drizzle
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.userId, userId),
          isNull(refreshTokens.tokenLookup),
          gt(refreshTokens.expiresAt, new Date()),
          isNull(refreshTokens.revokedAt)
        )
      );
  }

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
