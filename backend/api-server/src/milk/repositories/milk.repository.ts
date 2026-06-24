import { Injectable, Inject } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import { milkEntries, animals, type MilkEntry, type InsertMilkEntry } from "@workspace/db";
import { eq, and } from "drizzle-orm";

@Injectable()
export class MilkRepository {
  constructor(@Inject(DatabaseService) private dbService: DatabaseService) {}

  async findById(id: number): Promise<MilkEntry | null> {
    const results = await this.dbService.drizzle
      .select()
      .from(milkEntries)
      .where(eq(milkEntries.id, id))
      .limit(1);
    return results[0] || null;
  }

  async getAnimalMilkHistory(animalId: number): Promise<MilkEntry[]> {
    return this.dbService.drizzle
      .select()
      .from(milkEntries)
      .where(eq(milkEntries.animalId, animalId));
  }

  async getFarmMilkHistory(farmId: string): Promise<any[]> {
    return this.dbService.drizzle
      .select({
        id: milkEntries.id,
        animalId: milkEntries.animalId,
        animalName: animals.name,
        session: milkEntries.session,
        quantity: milkEntries.quantity,
        date: milkEntries.date,
        fat: milkEntries.fat,
        snf: milkEntries.snf,
        notes: milkEntries.notes,
        createdAt: milkEntries.createdAt,
      })
      .from(milkEntries)
      .innerJoin(animals, eq(milkEntries.animalId, animals.id))
      .where(eq(animals.farmId, farmId));
  }

  async create(data: InsertMilkEntry): Promise<MilkEntry> {
    const results = await this.dbService.drizzle
      .insert(milkEntries)
      .values(data)
      .returning();
    return results[0];
  }

  async update(id: number, data: Partial<MilkEntry>): Promise<MilkEntry> {
    const results = await this.dbService.drizzle
      .update(milkEntries)
      .set(data)
      .where(eq(milkEntries.id, id))
      .returning();
    return results[0];
  }

  async delete(id: number): Promise<void> {
    await this.dbService.drizzle.delete(milkEntries).where(eq(milkEntries.id, id));
  }
}
