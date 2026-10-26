import { Injectable, Inject } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import { otpCodes, type OtpCode, type InsertOtpCode } from "@workspace/db";
import { eq, and, gt, isNull } from "drizzle-orm";

@Injectable()
export class OtpRepository {
  constructor(@Inject(DatabaseService) private dbService: DatabaseService) {}

  async findActiveOtps(email: string): Promise<OtpCode[]> {
    return this.dbService.drizzle
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.email, email),
          gt(otpCodes.expiresAt, new Date()),
          isNull(otpCodes.usedAt)
        )
      );
  }

  async create(data: InsertOtpCode): Promise<OtpCode> {
    const results = await this.dbService.drizzle
      .insert(otpCodes)
      .values(data)
      .returning();
    return results[0];
  }

  async markUsed(id: number): Promise<void> {
    await this.dbService.drizzle
      .update(otpCodes)
      .set({ usedAt: new Date() })
      .where(eq(otpCodes.id, id));
  }

  /**
   * Retire every code still live for an address.
   *
   * Called before issuing a new one, so only the newest code ever works.
   * Without this each resend added another valid code — with a 5 minute expiry
   * and three sends a minute, roughly fifteen could be accepted at once, which
   * multiplies the chance of guessing one.
   *
   * Marks them used rather than deleting, so the audit trail survives;
   * findActiveOtps already filters on `usedAt IS NULL`.
   *
   * (This replaces a method named `deleteExpired` whose predicate actually
   * matched *unexpired* codes, and which nothing ever called.)
   */
  async invalidateActiveForEmail(email: string): Promise<void> {
    await this.dbService.drizzle
      .update(otpCodes)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(otpCodes.email, email),
          isNull(otpCodes.usedAt),
          gt(otpCodes.expiresAt, new Date())
        )
      );
  }
}
