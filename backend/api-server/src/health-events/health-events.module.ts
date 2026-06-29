import { Module } from "@nestjs/common";
import { HealthEventsController } from "./controllers/health-events.controller";
import { HealthEventsService } from "./services/health-events.service";
import { HealthEventsRepository } from "./repositories/health-events.repository";
import { AnimalsRepository } from "../animals/repositories/animals.repository";
import { FarmsRepository } from "../farms/repositories/farms.repository";

@Module({
  controllers: [HealthEventsController],
  providers: [
    HealthEventsService,
    HealthEventsRepository,
    AnimalsRepository,
    FarmsRepository,
  ],
  exports: [HealthEventsService],
})
export class HealthEventsModule {}
