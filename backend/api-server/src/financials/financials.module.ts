import { Module } from "@nestjs/common";
import { FinancialsController } from "./controllers/financials.controller";
import { FinancialsService } from "./services/financials.service";
import { FinancialsRepository } from "./repositories/financials.repository";
import { FarmsRepository } from "../farms/repositories/farms.repository";

@Module({
  controllers: [FinancialsController],
  providers: [
    FinancialsService,
    FinancialsRepository,
    FarmsRepository,
  ],
  exports: [FinancialsService],
})
export class FinancialsModule {}
