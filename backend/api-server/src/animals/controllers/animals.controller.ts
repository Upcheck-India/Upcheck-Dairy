import { Controller, Get, Post, Put, Delete, Body, Param, Inject, Headers } from "@nestjs/common";
import { AnimalsService } from "../services/animals.service";
import { CreateAnimalDto } from "../dto/create-animal.dto";
import { UpdateAnimalDto } from "../dto/update-animal.dto";
import { GetUser } from "../../common/decorators/auth.decorators";
import type { Farmer } from "@workspace/db";

@Controller("animals")
export class AnimalsController {
  constructor(@Inject(AnimalsService) private readonly animalsService: AnimalsService) {}

  @Post()
  async create(@GetUser() user: Farmer, @Body() dto: CreateAnimalDto) {
    return this.animalsService.create(user.id, dto);
  }

  @Get()
  async getMyAnimals(@GetUser() user: Farmer, @Headers("x-farm-id") farmId: string) {
    return this.animalsService.getByFarm(user.id, farmId);
  }

  @Get("farm/:farmId")
  async getByFarm(@GetUser() user: Farmer, @Param("farmId") farmId: string) {
    return this.animalsService.getByFarm(user.id, farmId);
  }

  @Get(":id")
  async getById(@GetUser() user: Farmer, @Param("id") id: string) {
    return this.animalsService.getById(user.id, Number(id));
  }

  @Put(":id")
  async update(@GetUser() user: Farmer, @Param("id") id: string, @Body() dto: UpdateAnimalDto) {
    return this.animalsService.update(user.id, Number(id), dto);
  }

  @Delete(":id")
  async remove(@GetUser() user: Farmer, @Param("id") id: string) {
    await this.animalsService.delete(user.id, Number(id));
    return { success: true };
  }
}
