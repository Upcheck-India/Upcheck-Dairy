import { Module } from "@nestjs/common";
import { FarmController, HealthController } from "./farm.controller";
import { FarmService } from "./farm.service";

@Module({
  controllers: [FarmController, HealthController],
  providers: [FarmService],
  exports: [FarmService],
})
export class FarmModule {}
