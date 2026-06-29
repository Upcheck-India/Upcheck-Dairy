import { Injectable, Inject, NotFoundException, ForbiddenException } from "@nestjs/common";
import { VaccinationsRepository } from "../repositories/vaccinations.repository";
import { AnimalsRepository } from "../../animals/repositories/animals.repository";
import { FarmsRepository } from "../../farms/repositories/farms.repository";
import { CreateVaccinationDto } from "../dto/create-vaccination.dto";
import { UpdateVaccinationDto } from "../dto/update-vaccination.dto";
import { type Vaccination } from "@workspace/db";

@Injectable()
export class VaccinationsService {
  constructor(
    @Inject(VaccinationsRepository) private vaccinationsRepository: VaccinationsRepository,
    @Inject(AnimalsRepository) private animalsRepository: AnimalsRepository,
    @Inject(FarmsRepository) private farmsRepository: FarmsRepository
  ) {}

  private async verifyFarmOwnership(farmId: string, ownerFarmerId: string): Promise<void> {
    const farm = await this.farmsRepository.findById(farmId);
    if (!farm) {
      throw new NotFoundException("Farm not found");
    }
    if (farm.ownerFarmerId !== ownerFarmerId) {
      throw new ForbiddenException("You do not own this farm");
    }
  }

  private async verifyAnimalOwnership(animalId: number, ownerFarmerId: string): Promise<string> {
    const animal = await this.animalsRepository.findById(animalId);
    if (!animal) {
      throw new NotFoundException("Animal not found");
    }
    await this.verifyFarmOwnership(animal.farmId, ownerFarmerId);
    return animal.farmId;
  }

  async create(ownerFarmerId: string, dto: CreateVaccinationDto): Promise<Vaccination> {
    await this.verifyAnimalOwnership(dto.animalId, ownerFarmerId);
    return this.vaccinationsRepository.create({
      ...dto,
      scheduledDate: new Date(dto.scheduledDate),
      administeredDate: dto.administeredDate ? new Date(dto.administeredDate) : null,
      nextDueDate: dto.nextDueDate ? new Date(dto.nextDueDate) : null,
      cost: dto.cost ? dto.cost.toString() : null,
      batchNo: dto.batchNo || null,
      administeredBy: dto.administeredBy || null,
      note: dto.note || null,
    });
  }

  async getAnimalHistory(ownerFarmerId: string, animalId: number): Promise<Vaccination[]> {
    await this.verifyAnimalOwnership(animalId, ownerFarmerId);
    return this.vaccinationsRepository.getAnimalVaccinationHistory(animalId);
  }

  async getFarmHistory(ownerFarmerId: string, farmId: string): Promise<any[]> {
    await this.verifyFarmOwnership(farmId, ownerFarmerId);
    return this.vaccinationsRepository.getFarmVaccinationHistory(farmId);
  }

  async update(ownerFarmerId: string, id: number, dto: UpdateVaccinationDto): Promise<Vaccination> {
    const vax = await this.vaccinationsRepository.findById(id);
    if (!vax) {
      throw new NotFoundException("Vaccination record not found");
    }
    await this.verifyAnimalOwnership(vax.animalId, ownerFarmerId);

    const updates: Partial<Vaccination> = {
      ...dto,
      scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : undefined,
      administeredDate: dto.administeredDate ? new Date(dto.administeredDate) : undefined,
      nextDueDate: dto.nextDueDate ? new Date(dto.nextDueDate) : undefined,
      cost: dto.cost ? dto.cost.toString() : undefined,
    } as any;

    return this.vaccinationsRepository.update(id, updates);
  }

  async delete(ownerFarmerId: string, id: number): Promise<void> {
    const vax = await this.vaccinationsRepository.findById(id);
    if (!vax) {
      throw new NotFoundException("Vaccination record not found");
    }
    await this.verifyAnimalOwnership(vax.animalId, ownerFarmerId);
    await this.vaccinationsRepository.delete(id);
  }
}
