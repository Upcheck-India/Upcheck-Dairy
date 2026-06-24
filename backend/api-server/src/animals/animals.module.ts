import { Module } from "@nestjs/common";
import { AnimalsController } from "./controllers/animals.controller";
import { AnimalsService } from "./services/animals.service";
import { AnimalsRepository } from "./repositories/animals.repository";
import { FarmsModule } from "../farms/farms.module";

@Module({
  imports: [FarmsModule],
  controllers: [AnimalsController],
  providers: [AnimalsService, AnimalsRepository],
  exports: [AnimalsService, AnimalsRepository],
})
export class AnimalsModule {}
