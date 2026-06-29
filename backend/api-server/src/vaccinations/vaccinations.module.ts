import { Module } from "@nestjs/common";
import { VaccinationsController } from "./controllers/vaccinations.controller";
import { VaccinationsService } from "./services/vaccinations.service";
import { VaccinationsRepository } from "./repositories/vaccinations.repository";
import { AnimalsRepository } from "../animals/repositories/animals.repository";
import { FarmsRepository } from "../farms/repositories/farms.repository";

@Module({
  controllers: [VaccinationsController],
  providers: [
    VaccinationsService,
    VaccinationsRepository,
    AnimalsRepository,
    FarmsRepository,
  ],
  exports: [VaccinationsService],
})
export class VaccinationsModule {}
