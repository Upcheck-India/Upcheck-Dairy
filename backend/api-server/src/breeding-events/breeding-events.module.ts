import { Module } from "@nestjs/common";
import { BreedingEventsController } from "./controllers/breeding-events.controller";
import { BreedingEventsService } from "./services/breeding-events.service";
import { BreedingEventsRepository } from "./repositories/breeding-events.repository";
import { AnimalsRepository } from "../animals/repositories/animals.repository";
import { FarmsRepository } from "../farms/repositories/farms.repository";

@Module({
  controllers: [BreedingEventsController],
  providers: [
    BreedingEventsService,
    BreedingEventsRepository,
    AnimalsRepository,
    FarmsRepository,
  ],
  exports: [BreedingEventsService],
})
export class BreedingEventsModule {}
