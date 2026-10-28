import { Controller, Get, Post, Put, Delete, Body, Param, Inject, Headers, ParseIntPipe } from "@nestjs/common";
import { VaccinationsService } from "../services/vaccinations.service";
import { CreateVaccinationDto } from "../dto/create-vaccination.dto";
import { UpdateVaccinationDto } from "../dto/update-vaccination.dto";
import { GetUser } from "../../common/decorators/auth.decorators";
import type { PublicFarmer } from "../../common/public-farmer";

@Controller("vaccinations")
export class VaccinationsController {
  constructor(@Inject(VaccinationsService) private readonly vaccinationsService: VaccinationsService) {}

  @Post()
  async create(@GetUser() user: PublicFarmer, @Body() dto: CreateVaccinationDto) {
    return this.vaccinationsService.create(user.id, dto);
  }

  @Get()
  async getMyVaccinations(@GetUser() user: PublicFarmer, @Headers("x-farm-id") farmId: string) {
    return this.vaccinationsService.getFarmHistory(user.id, farmId);
  }

  @Get("animal/:animalId")
  async getByAnimal(@GetUser() user: PublicFarmer, @Param("animalId", ParseIntPipe) animalId: number) {
    return this.vaccinationsService.getAnimalHistory(user.id, animalId);
  }

  @Put(":id")
  async update(@GetUser() user: PublicFarmer, @Param("id", ParseIntPipe) id: number, @Body() dto: UpdateVaccinationDto) {
    return this.vaccinationsService.update(user.id, id, dto);
  }

  @Delete(":id")
  async remove(@GetUser() user: PublicFarmer, @Param("id", ParseIntPipe) id: number) {
    await this.vaccinationsService.delete(user.id, id);
    return { success: true };
  }
}
