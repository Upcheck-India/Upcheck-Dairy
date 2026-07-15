import { Injectable, Inject } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import { animals, type Animal, type InsertAnimal } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";

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

  /** Returns all farm animals with the latest milk entry attached (null when none exists). */
  async findByFarmWithLatestMilk(
    farmId: string,
  ): Promise<(Animal & { lastMilkEntry: { quantity: number; session: string } | null })[]> {
    const rows = await this.dbService.drizzle
      .select({
        // All standard Animal columns (mapped to camelCase by Drizzle)
        id: animals.id,
        farmId: animals.farmId,
        name: animals.name,
        type: animals.type,
        breed: animals.breed,
        tagNumber: animals.tagNumber,
        photoUri: animals.photoUri,
        healthStatus: animals.healthStatus,
        notes: animals.notes,
        birthDate: animals.birthDate,
        nextVaccinationDate: animals.nextVaccinationDate,
        nextDeliveryDate: animals.nextDeliveryDate,
        lactationNumber: animals.lactationNumber,
        lastCalvingDate: animals.lastCalvingDate,
        expectedCalvingDate: animals.expectedCalvingDate,
        isPregnant: animals.isPregnant,
        bodyConditionScore: animals.bodyConditionScore,
        weightKg: animals.weightKg,
        shed: animals.shed,
        status: animals.status,
        gender: animals.gender,
        createdAt: animals.createdAt,
        updatedAt: animals.updatedAt,
        // Scalar correlated subquery: latest milk entry for this animal
        lastMilkEntry: sql<{ quantity: number; session: string } | null>`(
          SELECT json_build_object('quantity', me.quantity::float, 'session', me.session)
          FROM   milk_entries me
          WHERE  me.animal_id = animals.id
          ORDER  BY me.date DESC
          LIMIT  1
        )`,
      })
      .from(animals)
      .where(eq(animals.farmId, farmId));

    return rows as (Animal & { lastMilkEntry: { quantity: number; session: string } | null })[];
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
