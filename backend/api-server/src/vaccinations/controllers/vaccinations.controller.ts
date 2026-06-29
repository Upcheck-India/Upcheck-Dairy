import { Controller, Get, Post, Put, Delete, Body, Param, Inject, Headers } from "@nestjs/common";
import { VaccinationsService } from "../services/vaccinations.service";
import { CreateVaccinationDto } from "../dto/create-vaccination.dto";
import { UpdateVaccinationDto } from "../dto/update-vaccination.dto";
import { GetUser } from "../../common/decorators/auth.decorators";
import type { Farmer } from "@workspace/db";

@Controller("vaccinations")
export class VaccinationsController {
  constructor(@Inject(VaccinationsService) private readonly vaccinationsService: VaccinationsService) {}

  @Post()
  async create(@GetUser() user: Farmer, @Body() dto: CreateVaccinationDto) {
    return this.vaccinationsService.create(user.id, dto);
  }

  @Get()
  async getMyVaccinations(@GetUser() user: Farmer, @Headers("x-farm-id") farmId: string) {
    return this.vaccinationsService.getFarmHistory(user.id, farmId);
  }

  @Get("animal/:animalId")
  async getByAnimal(@GetUser() user: Farmer, @Param("animalId") animalId: string) {
    return this.vaccinationsService.getAnimalHistory(user.id, Number(animalId));
  }

  @Put(":id")
  async update(@GetUser() user: Farmer, @Param("id") id: string, @Body() dto: UpdateVaccinationDto) {
    return this.vaccinationsService.update(user.id, Number(id), dto);
  }

  @Delete(":id")
  async remove(@GetUser() user: Farmer, @Param("id") id: string) {
    await this.vaccinationsService.delete(user.id, Number(id));
    return { success: true };
  }
}
