import { Controller, Get, Post, Put, Delete, Body, Param, Inject, Headers, ParseIntPipe } from "@nestjs/common";
import { HealthEventsService } from "../services/health-events.service";
import { CreateHealthEventDto } from "../dto/create-health-event.dto";
import { UpdateHealthEventDto } from "../dto/update-health-event.dto";
import { GetUser } from "../../common/decorators/auth.decorators";
import type { Farmer } from "@workspace/db";

@Controller("health-events")
export class HealthEventsController {
  constructor(@Inject(HealthEventsService) private readonly healthEventsService: HealthEventsService) {}

  @Post()
  async create(@GetUser() user: Farmer, @Body() dto: CreateHealthEventDto) {
    return this.healthEventsService.create(user.id, dto);
  }

  @Get()
  async getMyHealthEvents(@GetUser() user: Farmer, @Headers("x-farm-id") farmId: string) {
    return this.healthEventsService.getFarmHistory(user.id, farmId);
  }

  @Get("animal/:animalId")
  async getByAnimal(@GetUser() user: Farmer, @Param("animalId", ParseIntPipe) animalId: number) {
    return this.healthEventsService.getAnimalHistory(user.id, animalId);
  }

  @Put(":id")
  async update(@GetUser() user: Farmer, @Param("id", ParseIntPipe) id: number, @Body() dto: UpdateHealthEventDto) {
    return this.healthEventsService.update(user.id, id, dto);
  }

  @Delete(":id")
  async remove(@GetUser() user: Farmer, @Param("id", ParseIntPipe) id: number) {
    await this.healthEventsService.delete(user.id, id);
    return { success: true };
  }
}
