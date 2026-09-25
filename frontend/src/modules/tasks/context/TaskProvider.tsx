import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Task } from "../models/Task";
import { taskRepository } from "../api/TaskRepository";
import { CreateTaskRequestDto, UpdateTaskRequestDto } from "../types/TaskDto";
import { useFarm } from "../../../modules/farms/hooks/useFarm";

interface TaskContextType {
  loading: boolean;
  error: Error | null;
  tasks: Task[];
  createTask: (dto: CreateTaskRequestDto) => Promise<Task>;
  updateTask: (id: number, dto: UpdateTaskRequestDto) => Promise<Task>;
  removeTask: (id: number) => Promise<void>;
  toggleTaskComplete: (id: number) => Promise<Task>;
  generateDailyTasks: (dateStr: string) => Promise<Task[]>;
  refresh: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | null>(null);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const { activeFarm } = useFarm();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTasks = useCallback(async (farmId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await taskRepository.getTasks(farmId);
      setTasks(data);
    } catch (e: any) {
      setError(e instanceof Error ? e : new Error(e.message || "Failed to load tasks"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeFarm?.id) {
      fetchTasks(activeFarm.id);
    } else {
      setTasks([]);
    }
  }, [activeFarm?.id, fetchTasks]);

  const createTask = async (dto: CreateTaskRequestDto) => {
    try {
      const newTask = await taskRepository.createTask(dto);
      setTasks(prev => [...prev, newTask]);
      return newTask;
    } catch (e: any) {
      throw e instanceof Error ? e : new Error(e.message || "Failed to create task");
    }
  };

  const updateTask = async (id: number, dto: UpdateTaskRequestDto) => {
    try {
      const updated = await taskRepository.updateTask(id, dto);
      setTasks(prev => prev.map(t => (Number(t.id) === id ? updated : t)));
      return updated;
    } catch (e: any) {
      throw e instanceof Error ? e : new Error(e.message || "Failed to update task");
    }
  };

  const removeTask = async (id: number) => {
    try {
      await taskRepository.deleteTask(id);
      setTasks(prev => prev.filter(t => Number(t.id) !== id));
    } catch (e: any) {
      throw e instanceof Error ? e : new Error(e.message || "Failed to delete task");
    }
  };

  const toggleTaskComplete = async (id: number) => {
    const task = tasks.find(t => Number(t.id) === id);
    if (!task) throw new Error("Task not found");
    return updateTask(id, { completed: !task.completed });
  };

  const generateDailyTasks = async (dateStr: string) => {
    try {
      const newTasks = await taskRepository.generateDailyTasks(dateStr);
      // Merge generated tasks with state tasks, avoiding duplicates
      setTasks(prev => {
        const otherTasks = prev.filter(t => t.formattedDateString !== dateStr);
        return [...otherTasks, ...newTasks];
      });
      return newTasks;
    } catch (e: any) {
      throw e instanceof Error ? e : new Error(e.message || "Failed to generate daily tasks");
    }
  };

  const refresh = async () => {
    if (activeFarm?.id) {
      await fetchTasks(activeFarm.id);
    }
  };

  return (
    <TaskContext.Provider value={{
      loading,
      error,
      tasks,
      createTask,
      updateTask,
      removeTask,
      toggleTaskComplete,
      generateDailyTasks,
      refresh,
    }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext() {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error("useTaskContext must be used within TaskProvider");
  return ctx;
}
