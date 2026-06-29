import { Injectable, Inject, NotFoundException, ForbiddenException } from "@nestjs/common";
import { TasksRepository } from "../repositories/tasks.repository";
import { FarmsRepository } from "../../farms/repositories/farms.repository";
import { CreateTaskDto } from "../dto/create-task.dto";
import { UpdateTaskDto } from "../dto/update-task.dto";
import { type Task } from "@workspace/db";

@Injectable()
export class TasksService {
  constructor(
    @Inject(TasksRepository) private tasksRepository: TasksRepository,
    @Inject(FarmsRepository) private farmsRepository: FarmsRepository
  ) {}

  private async verifyFarmOwnership(farmId: string, ownerFarmerId: string): Promise<void> {
    const farm = await this.farmsRepository.findById(farmId);
    if (!farm) {
      throw new NotFoundException("Farm not found");
    }
    if (farm.ownerFarmerId !== ownerFarmerId) {
      throw new ForbiddenException("You do not own this farm");
    }
  }

  async create(ownerFarmerId: string, dto: CreateTaskDto): Promise<Task> {
    await this.verifyFarmOwnership(dto.farmId, ownerFarmerId);
    return this.tasksRepository.create({
      ...dto,
      date: new Date(dto.date),
      completed: dto.completed ?? false,
      priority: dto.priority ?? "normal",
    });
  }

  async getFarmHistory(ownerFarmerId: string, farmId: string): Promise<Task[]> {
    await this.verifyFarmOwnership(farmId, ownerFarmerId);
    return this.tasksRepository.findByFarm(farmId);
  }

  async generateDailyTasks(ownerFarmerId: string, farmId: string, dateStr: string): Promise<Task[]> {
    await this.verifyFarmOwnership(farmId, ownerFarmerId);

    const queryDate = new Date(dateStr);
    const startOfDay = new Date(queryDate.getFullYear(), queryDate.getMonth(), queryDate.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(queryDate.getFullYear(), queryDate.getMonth(), queryDate.getDate(), 23, 59, 59, 999);

    const existingTasks = await this.tasksRepository.findTasksForDate(farmId, startOfDay, endOfDay);
    if (existingTasks.length > 0) {
      return existingTasks;
    }

    const defaultTasksData = [
      { farmId, title: "Morning Milking", titleTamil: "காலை கறவை", time: "5:00 AM", session: "morning", completed: false, date: startOfDay, type: "milk", priority: "high" },
      { farmId, title: "Morning Feed", titleTamil: "காலை தீவனம்", time: "6:00 AM", session: "morning", completed: false, date: startOfDay, type: "feed", priority: "normal" },
      { farmId, title: "Clean Shed", titleTamil: "தொழுவம் சுத்தம்", time: "6:30 AM", session: "morning", completed: false, date: startOfDay, type: "clean", priority: "normal" },
      { farmId, title: "Evening Milking", titleTamil: "மாலை கறவை", time: "4:00 PM", session: "evening", completed: false, date: startOfDay, type: "milk", priority: "high" },
      { farmId, title: "Evening Feed", titleTamil: "மாலை தீவனம்", time: "4:30 PM", session: "evening", completed: false, date: startOfDay, type: "feed", priority: "normal" },
      { farmId, title: "Record Income", titleTamil: "வருமானம் பதிவு", time: "7:00 PM", session: "evening", completed: false, date: startOfDay, type: "other", priority: "normal" },
      { farmId, title: "Mineral Mix — Water Trough", titleTamil: "தண்ணீர் தொட்டி சுத்தம்", time: "8:00 AM", session: "morning", completed: false, date: startOfDay, type: "feed", priority: "low" },
    ] as any[];

    return this.tasksRepository.createMany(defaultTasksData);
  }

  async update(ownerFarmerId: string, id: number, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.tasksRepository.findById(id);
    if (!task) {
      throw new NotFoundException("Task not found");
    }
    await this.verifyFarmOwnership(task.farmId, ownerFarmerId);

    const updates: Partial<Task> = {
      ...dto,
      date: dto.date ? new Date(dto.date) : undefined,
    } as any;

    return this.tasksRepository.update(id, updates);
  }

  async delete(ownerFarmerId: string, id: number): Promise<void> {
    const task = await this.tasksRepository.findById(id);
    if (!task) {
      throw new NotFoundException("Task not found");
    }
    await this.verifyFarmOwnership(task.farmId, ownerFarmerId);
    await this.tasksRepository.delete(id);
  }
}
