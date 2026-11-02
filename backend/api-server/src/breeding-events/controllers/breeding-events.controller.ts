import { Controller, Get, Post, Put, Delete, Body, Param, Inject, Headers, ParseIntPipe } from "@nestjs/common";
import { BreedingEventsService } from "../services/breeding-events.service";
import { CreateBreedingEventDto } from "../dto/create-breeding-event.dto";
import { UpdateBreedingEventDto } from "../dto/update-breeding-event.dto";
import { GetUser } from "../../common/decorators/auth.decorators";
import type { PublicFarmer } from "../../common/public-farmer";

@Controller("breeding-events")
export class BreedingEventsController {
  constructor(@Inject(BreedingEventsService) private readonly breedingEventsService: BreedingEventsService) {}

  @Post()
  async create(@GetUser() user: PublicFarmer, @Body() dto: CreateBreedingEventDto) {
    return this.breedingEventsService.create(user.id, dto);
  }

  @Get()
  async getMyBreedingEvents(@GetUser() user: PublicFarmer, @Headers("x-farm-id") farmId: string) {
    return this.breedingEventsService.getFarmHistory(user.id, farmId);
  }

  @Get("animal/:animalId")
  async getByAnimal(@GetUser() user: PublicFarmer, @Param("animalId", ParseIntPipe) animalId: number) {
    return this.breedingEventsService.getAnimalHistory(user.id, animalId);
  }

  @Put(":id")
  async update(@GetUser() user: PublicFarmer, @Param("id", ParseIntPipe) id: number, @Body() dto: UpdateBreedingEventDto) {
    return this.breedingEventsService.update(user.id, id, dto);
  }

  @Delete(":id")
  async remove(@GetUser() user: PublicFarmer, @Param("id", ParseIntPipe) id: number) {
    await this.breedingEventsService.delete(user.id, id);
    return { success: true };
  }
}
