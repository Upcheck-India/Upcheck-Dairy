import { Module } from "@nestjs/common";
import { FarmsController, LegacyFarmController } from "./controllers/farms.controller";
import { FarmsService } from "./services/farms.service";
import { FarmsRepository } from "./repositories/farms.repository";

@Module({
  controllers: [FarmsController, LegacyFarmController],
  providers: [FarmsService, FarmsRepository],
  exports: [FarmsService, FarmsRepository],
})
export class FarmsModule {}
