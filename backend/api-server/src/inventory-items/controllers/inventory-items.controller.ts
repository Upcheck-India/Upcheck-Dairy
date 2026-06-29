import { Controller, Get, Post, Put, Delete, Body, Param, Inject, Headers } from "@nestjs/common";
import { InventoryItemsService } from "../services/inventory-items.service";
import { CreateInventoryItemDto } from "../dto/create-inventory-item.dto";
import { UpdateInventoryItemDto } from "../dto/update-inventory-item.dto";
import { GetUser } from "../../common/decorators/auth.decorators";
import type { Farmer } from "@workspace/db";

@Controller("inventory-items")
export class InventoryItemsController {
  constructor(@Inject(InventoryItemsService) private readonly inventoryItemsService: InventoryItemsService) {}

  @Post()
  async create(@GetUser() user: Farmer, @Body() dto: CreateInventoryItemDto) {
    return this.inventoryItemsService.create(user.id, dto);
  }

  @Get()
  async getMyInventoryItems(@GetUser() user: Farmer, @Headers("x-farm-id") farmId: string) {
    return this.inventoryItemsService.getFarmHistory(user.id, farmId);
  }

  @Put(":id")
  async update(@GetUser() user: Farmer, @Param("id") id: string, @Body() dto: UpdateInventoryItemDto) {
    return this.inventoryItemsService.update(user.id, Number(id), dto);
  }

  @Delete(":id")
  async remove(@GetUser() user: Farmer, @Param("id") id: string) {
    await this.inventoryItemsService.delete(user.id, Number(id));
    return { success: true };
  }
}
