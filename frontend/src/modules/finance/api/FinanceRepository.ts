import { apiClient } from "../../../core/api/ApiClient";
import { Storage } from "../../../core/storage/Storage";
import { IncomeEntry, ExpenseEntry } from "../models/FinanceEntries";
import { FinanceMapper } from "./FinanceMapper";
import type {
  IncomeEntryResponseDto,
  ExpenseEntryResponseDto,
  CreateIncomeEntryRequestDto,
  CreateExpenseEntryRequestDto,
} from "../types/FinanceDto";

export class FinanceRepository {
  private getIncomeCacheKey(farmId: string): string {
    return `upcheckdairy:${farmId}:income`;
  }

  private getExpenseCacheKey(farmId: string): string {
    return `upcheckdairy:${farmId}:expenses`;
  }

  // ── Income ────────────────────────────────────────────────────────────────

  async getIncomeEntries(farmId: string): Promise<IncomeEntry[]> {
    try {
      const dtos = await apiClient.get<IncomeEntryResponseDto[]>("/financials/income");
      const items = FinanceMapper.toIncomeList(dtos);
      await Storage.set(this.getIncomeCacheKey(farmId), dtos);
      return items;
    } catch (e) {
      console.warn("[FinanceRepository] Income API fetch failed, falling back to cache", e);
      const cached = await Storage.get<IncomeEntryResponseDto[]>(this.getIncomeCacheKey(farmId));
      if (cached) return FinanceMapper.toIncomeList(cached);
      return [];
    }
  }

  async createIncomeEntry(dto: CreateIncomeEntryRequestDto): Promise<IncomeEntry> {
    const responseDto = await apiClient.post<IncomeEntryResponseDto>("/financials/income", dto);
    return FinanceMapper.toIncomeEntry(responseDto);
  }

  async deleteIncomeEntry(id: number): Promise<void> {
    await apiClient.delete<void>(`/financials/income/${id}`);
  }

  // ── Expenses ──────────────────────────────────────────────────────────────

  async getExpenseEntries(farmId: string): Promise<ExpenseEntry[]> {
    try {
      const dtos = await apiClient.get<ExpenseEntryResponseDto[]>("/financials/expenses");
      const items = FinanceMapper.toExpenseList(dtos);
      await Storage.set(this.getExpenseCacheKey(farmId), dtos);
      return items;
    } catch (e) {
      console.warn("[FinanceRepository] Expense API fetch failed, falling back to cache", e);
      const cached = await Storage.get<ExpenseEntryResponseDto[]>(this.getExpenseCacheKey(farmId));
      if (cached) return FinanceMapper.toExpenseList(cached);
      return [];
    }
  }

  async createExpenseEntry(dto: CreateExpenseEntryRequestDto): Promise<ExpenseEntry> {
    const responseDto = await apiClient.post<ExpenseEntryResponseDto>("/financials/expenses", dto);
    return FinanceMapper.toExpenseEntry(responseDto);
  }

  async deleteExpenseEntry(id: number): Promise<void> {
    await apiClient.delete<void>(`/financials/expenses/${id}`);
  }
}

export const financeRepository = new FinanceRepository();
