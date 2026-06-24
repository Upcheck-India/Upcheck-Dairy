import { Injectable, Inject } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import { farmers, type Farmer, type InsertFarmer } from "@workspace/db";
import { eq } from "drizzle-orm";

@Injectable()
export class UserRepository {
  constructor(@Inject(DatabaseService) private dbService: DatabaseService) {}

  async findById(id: string): Promise<Farmer | null> {
    const results = await this.dbService.drizzle
      .select()
      .from(farmers)
      .where(eq(farmers.id, id))
      .limit(1);
    return results[0] || null;
  }

  async findByEmail(email: string): Promise<Farmer | null> {
    const results = await this.dbService.drizzle
      .select()
      .from(farmers)
      .where(eq(farmers.email, email))
      .limit(1);
    return results[0] || null;
  }

  async findByPhone(phone: string): Promise<Farmer | null> {
    const results = await this.dbService.drizzle
      .select()
      .from(farmers)
      .where(eq(farmers.phone, phone))
      .limit(1);
    return results[0] || null;
  }

  async create(data: InsertFarmer): Promise<Farmer> {
    const results = await this.dbService.drizzle
      .insert(farmers)
      .values(data)
      .returning();
    return results[0];
  }

  async update(id: string, data: Partial<Farmer>): Promise<Farmer> {
    const results = await this.dbService.drizzle
      .update(farmers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(farmers.id, id))
      .returning();
    return results[0];
  }

  async delete(id: string): Promise<void> {
    await this.dbService.drizzle.delete(farmers).where(eq(farmers.id, id));
  }
}
