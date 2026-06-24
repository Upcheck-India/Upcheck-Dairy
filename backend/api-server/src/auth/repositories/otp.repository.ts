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

  async deleteExpired(email: string): Promise<void> {
    await this.dbService.drizzle
      .delete(otpCodes)
      .where(
        and(
          eq(otpCodes.email, email),
          and(
            isNull(otpCodes.usedAt),
            gt(otpCodes.expiresAt, new Date())
          )
        )
      );
  }
}
