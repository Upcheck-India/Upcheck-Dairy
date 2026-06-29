import { useTaskContext } from "../context/TaskProvider";

export function useTasks() {
  const context = useTaskContext();
  return {
    loading: context.loading,
    error: context.error,
    tasks: context.tasks,
    createTask: context.createTask,
    updateTask: context.updateTask,
    removeTask: context.removeTask,
    toggleTaskComplete: context.toggleTaskComplete,
    generateDailyTasks: context.generateDailyTasks,
    refresh: context.refresh,
  };
}
