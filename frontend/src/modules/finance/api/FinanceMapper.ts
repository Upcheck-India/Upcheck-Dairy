import { IncomeEntry, ExpenseEntry } from "../models/FinanceEntries";
import type { IncomeEntryResponseDto, ExpenseEntryResponseDto } from "../types/FinanceDto";

export class FinanceMapper {
  static toIncomeEntry(dto: IncomeEntryResponseDto): IncomeEntry {
    return new IncomeEntry({
      id: dto.id,
      farmId: dto.farmId,
      date: new Date(dto.date),
      buyer: dto.buyer,
      quantitySold: Number(dto.quantitySold),
      ratePerLitre: Number(dto.ratePerLitre),
      totalExpected: Number(dto.totalExpected),
      totalReceived: Number(dto.totalReceived),
      fatPercentage: dto.fatPercentage !== null ? Number(dto.fatPercentage) : null,
      snfPercentage: dto.snfPercentage !== null ? Number(dto.snfPercentage) : null,
      notes: dto.notes,
      attachmentUrl: dto.attachmentUrl ?? null,
      createdAt: new Date(dto.createdAt),
    });
  }

  static toIncomeList(dtos: IncomeEntryResponseDto[]): IncomeEntry[] {
    return dtos.map(this.toIncomeEntry.bind(this));
  }

  static toExpenseEntry(dto: ExpenseEntryResponseDto): ExpenseEntry {
    return new ExpenseEntry({
      id: dto.id,
      farmId: dto.farmId,
      date: new Date(dto.date),
      category: dto.category,
      description: dto.description,
      amount: Number(dto.amount),
      attachmentUrl: dto.attachmentUrl ?? null,
      createdAt: new Date(dto.createdAt),
    });
  }

  static toExpenseList(dtos: ExpenseEntryResponseDto[]): ExpenseEntry[] {
    return dtos.map(this.toExpenseEntry.bind(this));
  }
}
