import { Injectable, Inject, NotFoundException, ForbiddenException } from "@nestjs/common";
import { FinancialsRepository } from "../repositories/financials.repository";
import { FarmsRepository } from "../../farms/repositories/farms.repository";
import { CreateIncomeEntryDto } from "../dto/create-income-entry.dto";
import { CreateExpenseEntryDto } from "../dto/create-expense-entry.dto";
import { type IncomeEntry, type ExpenseEntry } from "@workspace/db";

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
    });
  }

  async deleteExpenseEntry(ownerFarmerId: string, id: number): Promise<void> {
    const entry = await this.financialsRepository.findExpenseById(id);
    if (!entry) throw new NotFoundException("Expense entry not found");
    await this.verifyFarmOwnership(entry.farmId, ownerFarmerId);
    await this.financialsRepository.deleteExpense(id);
  }
}
