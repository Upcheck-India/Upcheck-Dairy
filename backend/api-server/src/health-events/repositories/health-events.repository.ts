import { Injectable, Inject } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import { healthEvents, animals, type HealthEvent, type InsertHealthEvent } from "@workspace/db";
import { eq } from "drizzle-orm";

@Injectable()
export class HealthEventsRepository {
  constructor(@Inject(DatabaseService) private dbService: DatabaseService) {}

  async findById(id: number): Promise<HealthEvent | null> {
    const results = await this.dbService.drizzle
      .select()
      .from(healthEvents)
      .where(eq(healthEvents.id, id))
      .limit(1);
    return results[0] || null;
  }

  async getAnimalHealthHistory(animalId: number): Promise<HealthEvent[]> {
    return this.dbService.drizzle
      .select()
      .from(healthEvents)
      .where(eq(healthEvents.animalId, animalId));
  }

  async getFarmHealthHistory(farmId: string): Promise<any[]> {
    return this.dbService.drizzle
      .select({
        id: healthEvents.id,
        animalId: healthEvents.animalId,
        animalName: animals.name,
        date: healthEvents.date,
        type: healthEvents.type,
        description: healthEvents.description,
        veterinarianName: healthEvents.veterinarianName,
        cost: healthEvents.cost,
        followUpDate: healthEvents.followUpDate,
        createdAt: healthEvents.createdAt,
      })
      .from(healthEvents)
      .innerJoin(animals, eq(healthEvents.animalId, animals.id))
      .where(eq(animals.farmId, farmId));
  }

  async create(data: InsertHealthEvent): Promise<HealthEvent> {
    const results = await this.dbService.drizzle
      .insert(healthEvents)
      .values(data)
      .returning();
    return results[0];
  }

  async update(id: number, data: Partial<HealthEvent>): Promise<HealthEvent> {
    const results = await this.dbService.drizzle
      .update(healthEvents)
      .set(data)
      .where(eq(healthEvents.id, id))
      .returning();
    return results[0];
  }

  async delete(id: number): Promise<void> {
    await this.dbService.drizzle.delete(healthEvents).where(eq(healthEvents.id, id));
  }
}
