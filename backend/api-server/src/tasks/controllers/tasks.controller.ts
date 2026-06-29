import { Controller, Get, Post, Put, Delete, Body, Param, Inject, Headers } from "@nestjs/common";
import { TasksService } from "../services/tasks.service";
import { CreateTaskDto } from "../dto/create-task.dto";
import { UpdateTaskDto } from "../dto/update-task.dto";
import { GetUser } from "../../common/decorators/auth.decorators";
import type { Farmer } from "@workspace/db";

@Controller("tasks")
export class TasksController {
  constructor(@Inject(TasksService) private readonly tasksService: TasksService) {}

  @Post()
  async create(@GetUser() user: Farmer, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(user.id, dto);
  }

  @Get()
  async getMyTasks(@GetUser() user: Farmer, @Headers("x-farm-id") farmId: string) {
    return this.tasksService.getFarmHistory(user.id, farmId);
  }

  @Post("generate-daily")
  async generateDaily(@GetUser() user: Farmer, @Headers("x-farm-id") farmId: string, @Body("date") dateStr: string) {
    return this.tasksService.generateDailyTasks(user.id, farmId, dateStr);
  }

  @Put(":id")
  async update(@GetUser() user: Farmer, @Param("id") id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(user.id, Number(id), dto);
  }

  @Delete(":id")
  async remove(@GetUser() user: Farmer, @Param("id") id: string) {
    await this.tasksService.delete(user.id, Number(id));
    return { success: true };
  }
}
