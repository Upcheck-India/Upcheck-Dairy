import { Task } from "../models/Task";
import { TaskResponseDto } from "../types/TaskDto";

export class TaskMapper {
  static toDomain(dto: TaskResponseDto): Task {
    return new Task({
      id: dto.id.toString(),
      farmId: dto.farmId,
      animalId: dto.animalId ? dto.animalId.toString() : null,
      title: dto.title,
      time: dto.time,
      session: dto.session,
      completed: dto.completed,
      date: new Date(dto.date),
      type: dto.type,
      priority: dto.priority,
      createdAt: dto.createdAt ? new Date(dto.createdAt) : null,
    });
  }

  static toDomainList(dtos: TaskResponseDto[]): Task[] {
    if (!Array.isArray(dtos)) return [];
    return dtos.map(dto => TaskMapper.toDomain(dto));
  }
}
