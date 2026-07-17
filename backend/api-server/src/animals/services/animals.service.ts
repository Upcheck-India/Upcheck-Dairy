import { Injectable, Inject, NotFoundException, ConflictException, ForbiddenException } from "@nestjs/common";
import { AnimalsRepository } from "../repositories/animals.repository";
import { FarmsRepository } from "../../farms/repositories/farms.repository";
import { CreateAnimalDto } from "../dto/create-animal.dto";
import { UpdateAnimalDto } from "../dto/update-animal.dto";
import { type Animal } from "@workspace/db";

@Injectable()
export class AnimalsService {
  constructor(
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

  async create(ownerFarmerId: string, dto: CreateAnimalDto): Promise<Animal> {
    await this.verifyFarmOwnership(dto.farmId, ownerFarmerId);

    if (dto.tagNumber) {
      const existing = await this.animalsRepository.findByTag(dto.farmId, dto.tagNumber);
      if (existing) {
        throw new ConflictException(`Animal with tag number ${dto.tagNumber} already exists on this farm`);
      }
    }

    return this.animalsRepository.create({
      ...dto,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
      nextVaccinationDate: dto.nextVaccinationDate ? new Date(dto.nextVaccinationDate) : null,
      nextDeliveryDate: dto.nextDeliveryDate ? new Date(dto.nextDeliveryDate) : null,
      lastCalvingDate: dto.lastCalvingDate ? new Date(dto.lastCalvingDate) : null,
      expectedCalvingDate: dto.expectedCalvingDate ? new Date(dto.expectedCalvingDate) : null,
      bodyConditionScore: dto.bodyConditionScore ? dto.bodyConditionScore.toString() : null,
      weightKg: dto.weightKg ? dto.weightKg.toString() : null,
      photoUri: dto.photoUri || null,
      healthStatus: dto.healthStatus || "healthy",
      notes: dto.notes || null,
      lactationNumber: dto.lactationNumber || null,
      isPregnant: dto.isPregnant ?? false,
      status: dto.status || (dto.type === "calf" ? "calf" : (dto.isPregnant ? "pregnant" : "lactating")),
      shed: dto.shed || null,
    });
  }

  async update(ownerFarmerId: string, id: number, dto: UpdateAnimalDto): Promise<Animal> {
    const animal = await this.animalsRepository.findById(id);
    if (!animal) {
      throw new NotFoundException("Animal not found");
    }

    await this.verifyFarmOwnership(animal.farmId, ownerFarmerId);

    if (dto.tagNumber && dto.tagNumber !== animal.tagNumber) {
      const existing = await this.animalsRepository.findByTag(animal.farmId, dto.tagNumber);
      if (existing) {
        throw new ConflictException(`Animal with tag number ${dto.tagNumber} already exists on this farm`);
      }
    }

    const updates: Partial<Animal> = {
      ...dto,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      nextVaccinationDate: dto.nextVaccinationDate ? new Date(dto.nextVaccinationDate) : undefined,
      nextDeliveryDate: dto.nextDeliveryDate ? new Date(dto.nextDeliveryDate) : undefined,
      lastCalvingDate: dto.lastCalvingDate ? new Date(dto.lastCalvingDate) : undefined,
      expectedCalvingDate: dto.expectedCalvingDate ? new Date(dto.expectedCalvingDate) : undefined,
      bodyConditionScore: dto.bodyConditionScore ? dto.bodyConditionScore.toString() : undefined,
      weightKg: dto.weightKg ? dto.weightKg.toString() : undefined,
    } as any;

    if (dto.isPregnant !== undefined && dto.status === undefined) {
      updates.status = dto.isPregnant ? "pregnant" : "lactating";
    }
    if (dto.type !== undefined && dto.status === undefined) {
      if (dto.type === "calf") {
        updates.status = "calf";
      }
    }

    return this.animalsRepository.update(id, updates);
  }

  async getById(ownerFarmerId: string, id: number): Promise<Animal> {
    const animal = await this.animalsRepository.findById(id);
    if (!animal) {
      throw new NotFoundException("Animal not found");
    }
    await this.verifyFarmOwnership(animal.farmId, ownerFarmerId);
    return animal;
  }

  async getByFarm(ownerFarmerId: string, farmId: string): Promise<any[]> {
    await this.verifyFarmOwnership(farmId, ownerFarmerId);
    return this.animalsRepository.findByFarmWithLatestMilk(farmId);
  }

  async delete(ownerFarmerId: string, id: number): Promise<void> {
    const animal = await this.animalsRepository.findById(id);
    if (!animal) {
      throw new NotFoundException("Animal not found");
    }
    await this.verifyFarmOwnership(animal.farmId, ownerFarmerId);
    await this.animalsRepository.delete(id);
  }
}
