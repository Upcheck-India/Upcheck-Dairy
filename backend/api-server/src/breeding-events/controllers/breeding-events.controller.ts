import { Controller, Get, Post, Put, Delete, Body, Param, Inject, Headers } from "@nestjs/common";
import { BreedingEventsService } from "../services/breeding-events.service";
import { CreateBreedingEventDto } from "../dto/create-breeding-event.dto";
import { UpdateBreedingEventDto } from "../dto/update-breeding-event.dto";
import { GetUser } from "../../common/decorators/auth.decorators";
import type { Farmer } from "@workspace/db";

@Controller("breeding-events")
export class BreedingEventsController {
  constructor(@Inject(BreedingEventsService) private readonly breedingEventsService: BreedingEventsService) {}

  @Post()
  async create(@GetUser() user: Farmer, @Body() dto: CreateBreedingEventDto) {
    return this.breedingEventsService.create(user.id, dto);
  }

  @Get()
  async getMyBreedingEvents(@GetUser() user: Farmer, @Headers("x-farm-id") farmId: string) {
    return this.breedingEventsService.getFarmHistory(user.id, farmId);
  }

  @Get("animal/:animalId")
  async getByAnimal(@GetUser() user: Farmer, @Param("animalId") animalId: string) {
    return this.breedingEventsService.getAnimalHistory(user.id, Number(animalId));
  }

  @Put(":id")
  async update(@GetUser() user: Farmer, @Param("id") id: string, @Body() dto: UpdateBreedingEventDto) {
    return this.breedingEventsService.update(user.id, Number(id), dto);
  }

  @Delete(":id")
  async remove(@GetUser() user: Farmer, @Param("id") id: string) {
    await this.breedingEventsService.delete(user.id, Number(id));
    return { success: true };
  }
}
