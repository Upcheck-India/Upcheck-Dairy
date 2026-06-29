export interface HerdSummary {
  total: number;
  healthy: number;
  attention: number;
  critical: number;
  cows: number;
  buffaloes: number;
  calves: number;
}

export interface DashboardAlert {
  id: string;
  type: "heat" | "calving" | "vaccine" | "dry_off" | "milk_drop";
  title: string;
  description: string;
  severity: "info" | "warning" | "critical";
}

export enum DashboardAction {
  AddAnimal,
  LogMilk,
  AddTask,
  AddExpense
}

export interface QuickAction {
  id: string;
  label: string;
  action: DashboardAction;
}

export interface DashboardState {
  herd: HerdSummary;
  milkTotalToday: number;
  taskCountsToday: {
    total: number;
    completed: number;
    pending: number;
  };
  financeToday: {
    income: number;
    expenses: number;
  };
  alerts: DashboardAlert[];
  quickActions: QuickAction[];
}
