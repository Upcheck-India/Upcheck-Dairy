import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { IncomeEntry, ExpenseEntry } from "../models/FinanceEntries";
import { financeRepository } from "../api/FinanceRepository";
import type { CreateIncomeEntryRequestDto, CreateExpenseEntryRequestDto } from "../types/FinanceDto";
import { useFarm } from "../../farms/hooks/useFarm";

interface FinanceContextType {
  loading: boolean;
  error: Error | null;
  incomeEntries: IncomeEntry[];
  expenseEntries: ExpenseEntry[];
  addIncome: (dto: CreateIncomeEntryRequestDto) => Promise<IncomeEntry>;
  removeIncome: (id: number) => Promise<void>;
  addExpense: (dto: CreateExpenseEntryRequestDto) => Promise<ExpenseEntry>;
  removeExpense: (id: number) => Promise<void>;
  refresh: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { activeFarm } = useFarm();
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>([]);
  const [expenseEntries, setExpenseEntries] = useState<ExpenseEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async (farmId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [income, expenses] = await Promise.all([
        financeRepository.getIncomeEntries(farmId),
        financeRepository.getExpenseEntries(farmId),
      ]);
      setIncomeEntries(income);
      setExpenseEntries(expenses);
    } catch (e: any) {
      setError(e instanceof Error ? e : new Error(e.message || "Failed to load financial data"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeFarm?.id) {
      fetchAll(activeFarm.id);
    } else {
      setIncomeEntries([]);
      setExpenseEntries([]);
    }
  }, [activeFarm?.id, fetchAll]);

  const addIncome = async (dto: CreateIncomeEntryRequestDto) => {
    setError(null);
    try {
      const entry = await financeRepository.createIncomeEntry(dto);
      setIncomeEntries(prev => [...prev, entry]);
      return entry;
    } catch (e: any) {
      const err = e instanceof Error ? e : new Error(e.message || "Failed to add income entry");
      setError(err);
      throw err;
    }
  };

  const removeIncome = async (id: number) => {
    setError(null);
    try {
      await financeRepository.deleteIncomeEntry(id);
      setIncomeEntries(prev => prev.filter(e => e.id !== id));
    } catch (e: any) {
      const err = e instanceof Error ? e : new Error(e.message || "Failed to delete income entry");
      setError(err);
      throw err;
    }
  };

  const addExpense = async (dto: CreateExpenseEntryRequestDto) => {
    setError(null);
    try {
      const entry = await financeRepository.createExpenseEntry(dto);
      setExpenseEntries(prev => [...prev, entry]);
      return entry;
    } catch (e: any) {
      const err = e instanceof Error ? e : new Error(e.message || "Failed to add expense entry");
      setError(err);
      throw err;
    }
  };

  const removeExpense = async (id: number) => {
    setError(null);
    try {
      await financeRepository.deleteExpenseEntry(id);
      setExpenseEntries(prev => prev.filter(e => e.id !== id));
    } catch (e: any) {
      const err = e instanceof Error ? e : new Error(e.message || "Failed to delete expense entry");
      setError(err);
      throw err;
    }
  };

  const refresh = async () => {
    if (activeFarm?.id) {
      await fetchAll(activeFarm.id);
    }
  };

  return (
    <FinanceContext.Provider value={{
      loading,
      error,
      incomeEntries,
      expenseEntries,
      addIncome,
      removeIncome,
      addExpense,
      removeExpense,
      refresh,
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinanceContext() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinanceContext must be used within FinanceProvider");
  return ctx;
}
