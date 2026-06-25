import { Module } from "@nestjs/common";
import { FarmsController, LegacyFarmController } from "./controllers/farms.controller";
import { FarmsService } from "./services/farms.service";
import { FarmsRepository } from "./repositories/farms.repository";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [FarmsController, LegacyFarmController],
  providers: [FarmsService, FarmsRepository],
  exports: [FarmsService, FarmsRepository],
})
export class FarmsModule {}
