import { Module } from "@nestjs/common";
import { MilkController } from "./controllers/milk.controller";
import { MilkService } from "./services/milk.service";
import { MilkRepository } from "./repositories/milk.repository";
import { AnimalsModule } from "../animals/animals.module";
import { FarmsModule } from "../farms/farms.module";

@Module({
  imports: [AnimalsModule, FarmsModule],
  controllers: [MilkController],
  providers: [MilkService, MilkRepository],
  exports: [MilkService, MilkRepository],
})
export class MilkModule {}
