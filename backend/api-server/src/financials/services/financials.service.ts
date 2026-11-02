import { Injectable, Inject, NotFoundException, ForbiddenException } from "@nestjs/common";
import { FinancialsRepository } from "../repositories/financials.repository";
import { FarmsRepository } from "../../farms/repositories/farms.repository";
import { CreateIncomeEntryDto } from "../dto/create-income-entry.dto";
import { CreateExpenseEntryDto } from "../dto/create-expense-entry.dto";
import { type IncomeEntry, type ExpenseEntry } from "@workspace/db";

type FinancialsOverview = {
  totalIncome: number;
  totalExpense: number;
  profit: number;
  pendingPayments: number;
  incomeCount: number;
  expenseCount: number;
  milkSold: number;
  recentEntries: FinancePassbookEntry[];
};

type FinancePassbookEntry = {
  id: number;
  farmId: string;
  type: "income" | "expense";
  title: string;
  subtitle: string;
  date: string;
  amount: number;
  pendingAmount: number;
  category: string | null;
  notes: string | null;
  attachmentUrl: string | null;
};

@Injectable()
export class FinancialsService {
  constructor(
    @Inject(FinancialsRepository) private financialsRepository: FinancialsRepository,
    @Inject(FarmsRepository) private farmsRepository: FarmsRepository
  ) {}

  private async verifyFarmOwnership(farmId: string, ownerFarmerId: string): Promise<void> {
    const farm = await this.farmsRepository.findById(farmId);
    if (!farm) throw new NotFoundException("Farm not found");
    if (farm.ownerFarmerId !== ownerFarmerId) throw new ForbiddenException("You do not own this farm");
  }

  private toNumber(value: string | number | null | undefined): number {
    return Number(value ?? 0);
  }

  private mapIncomeEntry(entry: IncomeEntry): FinancePassbookEntry {
    const pendingAmount = Math.max(0, this.toNumber(entry.totalExpected) - this.toNumber(entry.totalReceived));
    return {
      id: entry.id,
      farmId: entry.farmId,
      type: "income",
      title: entry.buyer,
      subtitle: `${this.toNumber(entry.quantitySold)} L`,
      date: entry.date.toISOString(),
      amount: this.toNumber(entry.totalReceived),
      pendingAmount,
      category: null,
      notes: entry.notes ?? null,
      attachmentUrl: entry.attachmentUrl ?? null,
    };
  }

  private mapExpenseEntry(entry: ExpenseEntry): FinancePassbookEntry {
    return {
      id: entry.id,
      farmId: entry.farmId,
      type: "expense",
      title: entry.description,
      subtitle: entry.category,
      date: entry.date.toISOString(),
      amount: this.toNumber(entry.amount),
      pendingAmount: 0,
      category: entry.category,
      notes: null,
      attachmentUrl: entry.attachmentUrl ?? null,
    };
  }

  async getOverview(ownerFarmerId: string, farmId: string): Promise<FinancialsOverview> {
    await this.verifyFarmOwnership(farmId, ownerFarmerId);
    const [incomeEntries, expenseEntries] = await Promise.all([
      this.financialsRepository.findIncomeByFarm(farmId),
      this.financialsRepository.findExpensesByFarm(farmId),
    ]);

    const totalIncome = incomeEntries.reduce((sum, entry) => sum + this.toNumber(entry.totalReceived), 0);
    const totalExpense = expenseEntries.reduce((sum, entry) => sum + this.toNumber(entry.amount), 0);
    const pendingPayments = incomeEntries.reduce((sum, entry) => {
      return sum + Math.max(0, this.toNumber(entry.totalExpected) - this.toNumber(entry.totalReceived));
    }, 0);
    const milkSold = incomeEntries.reduce((sum, entry) => sum + this.toNumber(entry.quantitySold), 0);

    const recentEntries = [...incomeEntries.map((entry) => this.mapIncomeEntry(entry)), ...expenseEntries.map((entry) => this.mapExpenseEntry(entry))]
      .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
      .slice(0, 8);

    return {
      totalIncome,
      totalExpense,
      profit: totalIncome - totalExpense,
      pendingPayments,
      incomeCount: incomeEntries.length,
      expenseCount: expenseEntries.length,
      milkSold,
      recentEntries,
    };
  }

  async getPassbookEntries(ownerFarmerId: string, farmId: string): Promise<FinancePassbookEntry[]> {
    await this.verifyFarmOwnership(farmId, ownerFarmerId);
    const [incomeEntries, expenseEntries] = await Promise.all([
      this.financialsRepository.findIncomeByFarm(farmId),
      this.financialsRepository.findExpensesByFarm(farmId),
    ]);

    return [...incomeEntries.map((entry) => this.mapIncomeEntry(entry)), ...expenseEntries.map((entry) => this.mapExpenseEntry(entry))]
      .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
  }

  // ── Income ────────────────────────────────────────────────────────────────

  async getIncomeEntries(ownerFarmerId: string, farmId: string): Promise<IncomeEntry[]> {
    await this.verifyFarmOwnership(farmId, ownerFarmerId);
    return this.financialsRepository.findIncomeByFarm(farmId);
  }

  async createIncomeEntry(ownerFarmerId: string, dto: CreateIncomeEntryDto): Promise<IncomeEntry> {
    await this.verifyFarmOwnership(dto.farmId, ownerFarmerId);
    return this.financialsRepository.createIncome({
      ...dto,
      date: new Date(dto.date),
      quantitySold: dto.quantitySold.toString(),
      ratePerLitre: dto.ratePerLitre.toString(),
      totalExpected: dto.totalExpected.toString(),
      totalReceived: dto.totalReceived.toString(),
      fatPercentage: dto.fatPercentage !== undefined ? dto.fatPercentage.toString() : null,
      snfPercentage: dto.snfPercentage !== undefined ? dto.snfPercentage.toString() : null,
      notes: dto.notes ?? null,
      attachmentUrl: dto.attachmentUrl ?? null,
    });
  }

  async deleteIncomeEntry(ownerFarmerId: string, id: number): Promise<void> {
    const entry = await this.financialsRepository.findIncomeById(id);
    if (!entry) throw new NotFoundException("Income entry not found");
    await this.verifyFarmOwnership(entry.farmId, ownerFarmerId);
    await this.financialsRepository.deleteIncome(id);
  }

  // ── Expenses ──────────────────────────────────────────────────────────────

  async getExpenseEntries(ownerFarmerId: string, farmId: string): Promise<ExpenseEntry[]> {
    await this.verifyFarmOwnership(farmId, ownerFarmerId);
    return this.financialsRepository.findExpensesByFarm(farmId);
  }

  async createExpenseEntry(ownerFarmerId: string, dto: CreateExpenseEntryDto): Promise<ExpenseEntry> {
    await this.verifyFarmOwnership(dto.farmId, ownerFarmerId);
    return this.financialsRepository.createExpense({
      ...dto,
      date: new Date(dto.date),
      amount: dto.amount.toString(),
      attachmentUrl: dto.attachmentUrl ?? null,
    });
  }

  async deleteExpenseEntry(ownerFarmerId: string, id: number): Promise<void> {
    const entry = await this.financialsRepository.findExpenseById(id);
    if (!entry) throw new NotFoundException("Expense entry not found");
    await this.verifyFarmOwnership(entry.farmId, ownerFarmerId);
    await this.financialsRepository.deleteExpense(id);
  }
}
