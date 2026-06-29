import { Injectable, Inject } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import { vaccinations, animals, type Vaccination, type InsertVaccination } from "@workspace/db";
import { eq } from "drizzle-orm";

@Injectable()
export class VaccinationsRepository {
  constructor(@Inject(DatabaseService) private dbService: DatabaseService) {}

  async findById(id: number): Promise<Vaccination | null> {
    const results = await this.dbService.drizzle
      .select()
      .from(vaccinations)
      .where(eq(vaccinations.id, id))
      .limit(1);
    return results[0] || null;
  }

  async getAnimalVaccinationHistory(animalId: number): Promise<Vaccination[]> {
    return this.dbService.drizzle
      .select()
      .from(vaccinations)
      .where(eq(vaccinations.animalId, animalId));
  }

  async getFarmVaccinationHistory(farmId: string): Promise<any[]> {
    return this.dbService.drizzle
      .select({
        id: vaccinations.id,
        animalId: vaccinations.animalId,
        animalName: animals.name,
        vaccineName: vaccinations.vaccineName,
        vaccineType: vaccinations.vaccineType,
        scheduledDate: vaccinations.scheduledDate,
        administeredDate: vaccinations.administeredDate,
        batchNo: vaccinations.batchNo,
        administeredBy: vaccinations.administeredBy,
        cost: vaccinations.cost,
        nextDueDate: vaccinations.nextDueDate,
        note: vaccinations.note,
        createdAt: vaccinations.createdAt,
      })
      .from(vaccinations)
      .innerJoin(animals, eq(vaccinations.animalId, animals.id))
      .where(eq(animals.farmId, farmId));
  }

  async create(data: InsertVaccination): Promise<Vaccination> {
    const results = await this.dbService.drizzle
      .insert(vaccinations)
      .values(data)
      .returning();
    return results[0];
  }

  async update(id: number, data: Partial<Vaccination>): Promise<Vaccination> {
    const results = await this.dbService.drizzle
      .update(vaccinations)
      .set(data)
      .where(eq(vaccinations.id, id))
      .returning();
    return results[0];
  }

  async delete(id: number): Promise<void> {
    await this.dbService.drizzle.delete(vaccinations).where(eq(vaccinations.id, id));
  }
}
