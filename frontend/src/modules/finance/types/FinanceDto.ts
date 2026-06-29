export type ExpenseCategory = "feed" | "medicine" | "labor" | "equipment" | "other";

export interface IncomeEntryResponseDto {
  id: number;
  farmId: string;
  date: string;
  buyer: string;
  quantitySold: string | number;
  ratePerLitre: string | number;
  totalExpected: string | number;
  totalReceived: string | number;
  fatPercentage: string | number | null;
  snfPercentage: string | number | null;
  notes: string | null;
  createdAt: string;
}

export interface CreateIncomeEntryRequestDto {
  farmId: string;
  date: string;
  buyer: string;
  quantitySold: number;
  ratePerLitre: number;
  totalExpected: number;
  totalReceived: number;
  fatPercentage?: number;
  snfPercentage?: number;
  notes?: string;
}

export interface ExpenseEntryResponseDto {
  id: number;
  farmId: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: string | number;
  createdAt: string;
}

export interface CreateExpenseEntryRequestDto {
  farmId: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
}
