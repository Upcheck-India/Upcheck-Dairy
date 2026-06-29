import { Injectable, Inject } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import { tasks, type Task, type InsertTask } from "@workspace/db";
import { eq, and, gte, lte } from "drizzle-orm";

@Injectable()
export class TasksRepository {
  constructor(@Inject(DatabaseService) private dbService: DatabaseService) {}

  async findById(id: number): Promise<Task | null> {
    const results = await this.dbService.drizzle
      .select()
      .from(tasks)
      .where(eq(tasks.id, id))
      .limit(1);
    return results[0] || null;
  }

  async findByFarm(farmId: string): Promise<Task[]> {
    return this.dbService.drizzle
      .select()
      .from(tasks)
      .where(eq(tasks.farmId, farmId));
  }

  async findTasksForDate(farmId: string, startOfDay: Date, endOfDay: Date): Promise<Task[]> {
    return this.dbService.drizzle
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.farmId, farmId),
          gte(tasks.date, startOfDay),
          lte(tasks.date, endOfDay)
        )
      );
  }

  async create(data: InsertTask): Promise<Task> {
    const results = await this.dbService.drizzle
      .insert(tasks)
      .values(data)
      .returning();
    return results[0];
  }

  async createMany(data: InsertTask[]): Promise<Task[]> {
    if (data.length === 0) return [];
    return this.dbService.drizzle
      .insert(tasks)
      .values(data)
      .returning();
  }

  async update(id: number, data: Partial<Task>): Promise<Task> {
    const results = await this.dbService.drizzle
      .update(tasks)
      .set(data)
      .where(eq(tasks.id, id))
      .returning();
    return results[0];
  }

  async delete(id: number): Promise<void> {
    await this.dbService.drizzle.delete(tasks).where(eq(tasks.id, id));
  }
}
