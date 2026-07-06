import { useMemo } from "react";
import { useAnimals } from "../../animals/hooks/useAnimals";
import { useMilk } from "../../milk/hooks/useMilk";
import { useFinance } from "../../finance/hooks/useFinance";
import { useBreeding } from "../../breeding/hooks/useBreeding";
import { useVaccination } from "../../vaccination/hooks/useVaccination";
import { useTasks } from "../../tasks/hooks/useTasks";

// Import module-specific services
import { detectMilkAnomalies, MilkAnomaly } from "../../milk/services/anomalyDetector";
import { computeBreedingAlertsCount } from "../../breeding/services/breedingAlerts";
import { computeUpcomingVaccinationsCount } from "../../vaccination/services/vaccinationAlerts";
import {
  compute7DayFinancials,
  computeTodayIncome,
  computeTodayExpenses,
  DayFinancial,
} from "../../finance/services/financeSummary";
import { computeTodayTaskCounts, TaskCounts } from "../../tasks/services/taskSummary";
import { MilkEntry } from "../../milk/models/MilkEntry";

import { getISTDateString } from "../../../../utils/date";

function getTodayDateStr(): string {
  return getISTDateString();
}

/**
 * useDashboard — a pure composition hook for the dashboard screen.
 * Does not contain complex domain business calculations (such as anomaly
 * detection or financial aggregation algorithms).
 */
export function useDashboard() {
  const { animals, loading: animalsLoading, refresh: refreshAnimals } = useAnimals();
  const { milkEntries, loading: milkLoading, refresh: refreshMilk } = useMilk();
  const { incomeEntries, expenseEntries, refresh: refreshFinance } = useFinance();
  const { breedingEvents, refresh: refreshBreeding } = useBreeding();
  const { vaccinations, refresh: refreshVaccinations } = useVaccination();
  const { tasks, refresh: refreshTasks } = useTasks();

  // ── Milk anomalies ─────────────────────────────────────────────────────────
  const milkAnomalies = useMemo<MilkAnomaly[]>(() => {
    return detectMilkAnomalies(animals, milkEntries);
  }, [animals, milkEntries]);

  // ── Today's milk total ─────────────────────────────────────────────────────
  const todayMilkTotal = useMemo(() => {
    const today = getTodayDateStr();
    return milkEntries
      .filter((e: MilkEntry) => getISTDateString(e.date) === today)
      .reduce((s: number, e: MilkEntry) => s + e.quantity, 0);
  }, [milkEntries]);

  // ── 7-day financials chart data ────────────────────────────────────────────
  const sevenDayFinancials = useMemo<DayFinancial[]>(() => {
    return compute7DayFinancials(incomeEntries, expenseEntries);
  }, [incomeEntries, expenseEntries]);

  // ── Today's income / expense totals ───────────────────────────────────────
  const todayIncomeTotal = useMemo(() => {
    return computeTodayIncome(incomeEntries);
  }, [incomeEntries]);

  const todayExpenseTotal = useMemo(() => {
    return computeTodayExpenses(expenseEntries);
  }, [expenseEntries]);

  // ── Upcoming vaccination count (next 7 days) ───────────────────────────────
  const upcomingVaxCount = useMemo(() => {
    return computeUpcomingVaccinationsCount(vaccinations);
  }, [vaccinations]);

  // ── Breeding heat alerts ───────────────────────────────────────────────────
  const breedingAlertCount = useMemo(() => {
    return computeBreedingAlertsCount(animals, breedingEvents);
  }, [animals, breedingEvents]);

  // ── Today's task counts ────────────────────────────────────────────────────
  const todayTaskCounts = useMemo<TaskCounts>(() => {
    return computeTodayTaskCounts(tasks);
  }, [tasks]);

  // ── Herd summary ──────────────────────────────────────────────────────────
  const herdSummary = useMemo(() => {
    return {
      total: animals.length,
      cows: animals.filter((a) => a.type === "cow").length,
      buffaloes: animals.filter((a) => a.type === "buffalo").length,
      calves: animals.filter((a) => a.type === "calf").length,
      healthy: animals.filter((a) => a.healthStatus === "healthy").length,
      attention: animals.filter((a) => a.healthStatus === "attention").length,
      critical: animals.filter((a) => a.healthStatus === "critical").length,
    };
  }, [animals]);

  // ── Refresh all ───────────────────────────────────────────────────────────
  const refreshAll = async () => {
    await Promise.all([
      refreshAnimals(),
      refreshMilk(),
      refreshFinance(),
      refreshBreeding(),
      refreshVaccinations(),
      refreshTasks(),
    ]);
  };

  const loading = animalsLoading || milkLoading;

  return {
    // Raw data
    animals,
    milkEntries,
    incomeEntries,
    expenseEntries,
    breedingEvents,
    vaccinations,
    tasks,

    // Computed
    milkAnomalies,
    todayMilkTotal,
    todayIncomeTotal,
    todayExpenseTotal,
    sevenDayFinancials,
    upcomingVaxCount,
    breedingAlertCount,
    todayTaskCounts,
    herdSummary,

    // State
    loading,
    refreshAll,
  };
}
export type { MilkAnomaly, DayFinancial, TaskCounts };
