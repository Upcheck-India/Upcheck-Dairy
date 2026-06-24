import { Injectable, Inject } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import { farms, type Farm, type InsertFarm } from "@workspace/db";
import { eq } from "drizzle-orm";

@Injectable()
export class FarmsRepository {
  constructor(@Inject(DatabaseService) private dbService: DatabaseService) {}

  async findById(id: string): Promise<Farm | null> {
    const results = await this.dbService.drizzle
      .select()
      .from(farms)
      .where(eq(farms.id, id))
      .limit(1);
    return results[0] || null;
  }

  async findByOwner(ownerFarmerId: string): Promise<Farm[]> {
    return this.dbService.drizzle
      .select()
      .from(farms)
      .where(eq(farms.ownerFarmerId, ownerFarmerId));
  }

  async create(data: InsertFarm): Promise<Farm> {
    const results = await this.dbService.drizzle
      .insert(farms)
      .values(data)
      .returning();
    return results[0];
  }

  async update(id: string, data: Partial<Farm>): Promise<Farm> {
    const results = await this.dbService.drizzle
      .update(farms)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(farms.id, id))
      .returning();
    return results[0];
  }

  async delete(id: string): Promise<void> {
    await this.dbService.drizzle.delete(farms).where(eq(farms.id, id));
  }
}
