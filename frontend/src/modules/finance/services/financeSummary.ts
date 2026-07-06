import { IncomeEntry, ExpenseEntry } from "../models/FinanceEntries";
import { getISTDateString } from "../../../../utils/date";

export interface DayFinancial {
  date: string;
  income: number;
  expense: number;
}

function getTodayDateStr(): string {
  return getISTDateString();
}

function getPastDateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return getISTDateString(d);
}

export function compute7DayFinancials(incomeEntries: IncomeEntry[], expenseEntries: ExpenseEntry[]): DayFinancial[] {
  return Array.from({ length: 7 }, (_, i: number) => {
    const dateStr = getPastDateStr(6 - i);
    const dayLabel = new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

    const income = incomeEntries
      .filter((e: IncomeEntry) => getISTDateString(e.date) === dateStr)
      .reduce((s: number, e: IncomeEntry) => s + e.totalReceived, 0);

    const expense = expenseEntries
      .filter((e: ExpenseEntry) => getISTDateString(e.date) === dateStr)
      .reduce((s: number, e: ExpenseEntry) => s + e.amount, 0);

    return { date: dayLabel, income, expense };
  });
}

export function computeTodayIncome(incomeEntries: IncomeEntry[]): number {
  const today = getTodayDateStr();
  return incomeEntries
    .filter((e: IncomeEntry) => getISTDateString(e.date) === today)
    .reduce((s: number, e: IncomeEntry) => s + e.totalReceived, 0);
}

export function computeTodayExpenses(expenseEntries: ExpenseEntry[]): number {
  const today = getTodayDateStr();
  return expenseEntries
    .filter((e: ExpenseEntry) => getISTDateString(e.date) === today)
    .reduce((s: number, e: ExpenseEntry) => s + e.amount, 0);
}
