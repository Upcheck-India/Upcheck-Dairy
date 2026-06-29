import { Injectable, Inject } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import { incomeEntries, expenseEntries, type IncomeEntry, type ExpenseEntry, type InsertIncomeEntry, type InsertExpenseEntry } from "@workspace/db";
import { eq } from "drizzle-orm";

@Injectable()
export class FinancialsRepository {
  constructor(@Inject(DatabaseService) private dbService: DatabaseService) {}

  // ── Income ────────────────────────────────────────────────────────────────

  async findIncomeByFarm(farmId: string): Promise<IncomeEntry[]> {
    return this.dbService.drizzle
      .select()
      .from(incomeEntries)
      .where(eq(incomeEntries.farmId, farmId));
  }

  async createIncome(data: InsertIncomeEntry): Promise<IncomeEntry> {
    const results = await this.dbService.drizzle
      .insert(incomeEntries)
      .values(data)
      .returning();
    return results[0];
  }

  async deleteIncome(id: number): Promise<void> {
    await this.dbService.drizzle.delete(incomeEntries).where(eq(incomeEntries.id, id));
  }

  async findIncomeById(id: number): Promise<IncomeEntry | null> {
    const results = await this.dbService.drizzle
      .select()
      .from(incomeEntries)
      .where(eq(incomeEntries.id, id))
      .limit(1);
    return results[0] || null;
  }

  // ── Expenses ──────────────────────────────────────────────────────────────

  async findExpensesByFarm(farmId: string): Promise<ExpenseEntry[]> {
    return this.dbService.drizzle
      .select()
      .from(expenseEntries)
      .where(eq(expenseEntries.farmId, farmId));
  }

  async createExpense(data: InsertExpenseEntry): Promise<ExpenseEntry> {
    const results = await this.dbService.drizzle
      .insert(expenseEntries)
      .values(data)
      .returning();
    return results[0];
  }

  async deleteExpense(id: number): Promise<void> {
    await this.dbService.drizzle.delete(expenseEntries).where(eq(expenseEntries.id, id));
  }

  async findExpenseById(id: number): Promise<ExpenseEntry | null> {
    const results = await this.dbService.drizzle
      .select()
      .from(expenseEntries)
      .where(eq(expenseEntries.id, id))
      .limit(1);
    return results[0] || null;
  }
}
