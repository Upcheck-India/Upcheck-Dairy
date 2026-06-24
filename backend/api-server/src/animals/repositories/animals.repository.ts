import { Injectable, Inject } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import { animals, type Animal, type InsertAnimal } from "@workspace/db";
import { eq, and } from "drizzle-orm";

@Injectable()
export class AnimalsRepository {
  constructor(@Inject(DatabaseService) private dbService: DatabaseService) {}

  async findById(id: number): Promise<Animal | null> {
    const results = await this.dbService.drizzle
      .select()
      .from(animals)
      .where(eq(animals.id, id))
      .limit(1);
    return results[0] || null;
  }

  async findByFarm(farmId: string): Promise<Animal[]> {
    return this.dbService.drizzle
      .select()
      .from(animals)
      .where(eq(animals.farmId, farmId));
  }

  async findByTag(farmId: string, tagNumber: string): Promise<Animal | null> {
    const results = await this.dbService.drizzle
      .select()
      .from(animals)
      .where(and(eq(animals.farmId, farmId), eq(animals.tagNumber, tagNumber)))
      .limit(1);
    return results[0] || null;
  }

  async create(data: InsertAnimal): Promise<Animal> {
    const results = await this.dbService.drizzle
      .insert(animals)
      .values(data)
      .returning();
    return results[0];
  }

  async update(id: number, data: Partial<Animal>): Promise<Animal> {
    const results = await this.dbService.drizzle
      .update(animals)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(animals.id, id))
      .returning();
    return results[0];
  }

  async delete(id: number): Promise<void> {
    await this.dbService.drizzle.delete(animals).where(eq(animals.id, id));
  }
}
