import { Module } from "@nestjs/common";
import { TasksController } from "./controllers/tasks.controller";
import { TasksService } from "./services/tasks.service";
import { TasksRepository } from "./repositories/tasks.repository";
import { FarmsRepository } from "../farms/repositories/farms.repository";

@Module({
  controllers: [TasksController],
  providers: [
    TasksService,
    TasksRepository,
    FarmsRepository,
  ],
  exports: [TasksService],
})
export class TasksModule {}
