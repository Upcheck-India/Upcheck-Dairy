import { Task } from "../models/Task";

export interface TaskCounts {
  total: number;
  completed: number;
  pending: number;
}

function getTodayDateStr(): string {
  return new Date().toISOString().split("T")[0];
}

export function computeTodayTaskCounts(tasks: Task[]): TaskCounts {
  const today = getTodayDateStr();
  const todayTasks = tasks.filter((t: Task) => t.formattedDateString === today);
  return {
    total: todayTasks.length,
    completed: todayTasks.filter((t: Task) => t.completed).length,
    pending: todayTasks.filter((t: Task) => !t.completed).length,
  };
}
