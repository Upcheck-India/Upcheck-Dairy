import { apiClient } from "../../../core/api/ApiClient";
import { Storage } from "../../../core/storage/Storage";
import { Task } from "../models/Task";
import { TaskMapper } from "./TaskMapper";
import { TaskResponseDto, CreateTaskRequestDto, UpdateTaskRequestDto } from "../types/TaskDto";

export class TaskRepository {
  private getCacheKey(farmId: string): string {
    return `thulirfarm:${farmId}:tasks`;
  }

  async getTasks(farmId: string): Promise<Task[]> {
    try {
      const dtos = await apiClient.get<TaskResponseDto[]>("/tasks");
      const domainTasks = TaskMapper.toDomainList(dtos);
      await Storage.set(this.getCacheKey(farmId), dtos);
      return domainTasks;
    } catch (e) {
      console.warn("[TaskRepository] API fetch failed, falling back to local cache", e);
      const cachedDtos = await Storage.get<TaskResponseDto[]>(this.getCacheKey(farmId));
      if (cachedDtos) {
        return TaskMapper.toDomainList(cachedDtos);
      }
      return [];
    }
  }

  async createTask(dto: CreateTaskRequestDto): Promise<Task> {
    const responseDto = await apiClient.post<TaskResponseDto>("/tasks", dto);
    return TaskMapper.toDomain(responseDto);
  }

  async generateDailyTasks(dateStr: string): Promise<Task[]> {
    const responseDtos = await apiClient.post<TaskResponseDto[]>("/tasks/generate-daily", { date: dateStr });
    return TaskMapper.toDomainList(responseDtos);
  }

  async updateTask(id: number, dto: UpdateTaskRequestDto): Promise<Task> {
    const responseDto = await apiClient.put<TaskResponseDto>(`/tasks/${id}`, dto);
    return TaskMapper.toDomain(responseDto);
  }

  async deleteTask(id: number): Promise<void> {
    await apiClient.delete<void>(`/tasks/${id}`);
  }
}

export const taskRepository = new TaskRepository();
