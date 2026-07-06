import { Controller, Get, Post, Put, Delete, Body, Param, Inject, Headers, ParseIntPipe } from "@nestjs/common";
import { MilkService } from "../services/milk.service";
import { CreateMilkEntryDto } from "../dto/create-milk-entry.dto";
import { UpdateMilkEntryDto } from "../dto/update-milk-entry.dto";
import { GetUser } from "../../common/decorators/auth.decorators";
import type { Farmer } from "@workspace/db";

@Controller("milk")
export class MilkController {
  constructor(@Inject(MilkService) private readonly milkService: MilkService) {}

  @Post()
  async create(@GetUser() user: Farmer, @Body() dto: CreateMilkEntryDto) {
    return this.milkService.create(user.id, dto);
  }

  @Get()
  async getMyMilk(@GetUser() user: Farmer, @Headers("x-farm-id") farmId: string) {
    return this.milkService.getFarmHistory(user.id, farmId);
  }

  @Get("animal/:animalId")
  async getByAnimal(@GetUser() user: Farmer, @Param("animalId", ParseIntPipe) animalId: number) {
    return this.milkService.getAnimalHistory(user.id, animalId);
  }

  @Get("farm/:farmId")
  async getByFarm(@GetUser() user: Farmer, @Param("farmId") farmId: string) {
    return this.milkService.getFarmHistory(user.id, farmId);
  }

  @Put(":id")
  async update(@GetUser() user: Farmer, @Param("id", ParseIntPipe) id: number, @Body() dto: UpdateMilkEntryDto) {
    return this.milkService.update(user.id, id, dto);
  }

  @Delete(":id")
  async remove(@GetUser() user: Farmer, @Param("id", ParseIntPipe) id: number) {
    await this.milkService.delete(user.id, id);
    return { success: true };
  }
}
