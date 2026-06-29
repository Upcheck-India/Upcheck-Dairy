import { Injectable, Inject } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import { breedingEvents, animals, type BreedingEvent, type InsertBreedingEvent } from "@workspace/db";
import { eq } from "drizzle-orm";

@Injectable()
export class BreedingEventsRepository {
  constructor(@Inject(DatabaseService) private dbService: DatabaseService) {}

  async findById(id: number): Promise<BreedingEvent | null> {
    const results = await this.dbService.drizzle
      .select()
      .from(breedingEvents)
      .where(eq(breedingEvents.id, id))
      .limit(1);
    return results[0] || null;
  }

  async getAnimalBreedingHistory(animalId: number): Promise<BreedingEvent[]> {
    return this.dbService.drizzle
      .select()
      .from(breedingEvents)
      .where(eq(breedingEvents.animalId, animalId));
  }

  async getFarmBreedingHistory(farmId: string): Promise<any[]> {
    return this.dbService.drizzle
      .select({
        id: breedingEvents.id,
        animalId: breedingEvents.animalId,
        animalName: animals.name,
        eventType: breedingEvents.eventType,
        date: breedingEvents.date,
        note: breedingEvents.note,
        bullName: breedingEvents.bullName,
        expectedCalvingDate: breedingEvents.expectedCalvingDate,
        calvingGender: breedingEvents.calvingGender,
        createdAt: breedingEvents.createdAt,
      })
      .from(breedingEvents)
      .innerJoin(animals, eq(breedingEvents.animalId, animals.id))
      .where(eq(animals.farmId, farmId));
  }

  async create(data: InsertBreedingEvent): Promise<BreedingEvent> {
    const results = await this.dbService.drizzle
      .insert(breedingEvents)
      .values(data)
      .returning();
    return results[0];
  }

  async update(id: number, data: Partial<BreedingEvent>): Promise<BreedingEvent> {
    const results = await this.dbService.drizzle
      .update(breedingEvents)
      .set(data)
      .where(eq(breedingEvents.id, id))
      .returning();
    return results[0];
  }

  async delete(id: number): Promise<void> {
    await this.dbService.drizzle.delete(breedingEvents).where(eq(breedingEvents.id, id));
  }
}
