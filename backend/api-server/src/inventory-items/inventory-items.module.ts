import { Module } from "@nestjs/common";
import { InventoryItemsController } from "./controllers/inventory-items.controller";
import { InventoryItemsService } from "./services/inventory-items.service";
import { InventoryItemsRepository } from "./repositories/inventory-items.repository";
import { FarmsRepository } from "../farms/repositories/farms.repository";

@Module({
  controllers: [InventoryItemsController],
  providers: [
    InventoryItemsService,
    InventoryItemsRepository,
    FarmsRepository,
  ],
  exports: [InventoryItemsService],
})
export class InventoryItemsModule {}
