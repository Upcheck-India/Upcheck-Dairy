import { Injectable, Inject, NotFoundException, ForbiddenException } from "@nestjs/common";
import { MilkRepository } from "../repositories/milk.repository";
import { AnimalsRepository } from "../../animals/repositories/animals.repository";
import { FarmsRepository } from "../../farms/repositories/farms.repository";
import { CreateMilkEntryDto } from "../dto/create-milk-entry.dto";
import { UpdateMilkEntryDto } from "../dto/update-milk-entry.dto";
import { type MilkEntry } from "@workspace/db";

@Injectable()
export class MilkService {
  constructor(
    @Inject(MilkRepository) private milkRepository: MilkRepository,
    @Inject(AnimalsRepository) private animalsRepository: AnimalsRepository,
    @Inject(FarmsRepository) private farmsRepository: FarmsRepository
  ) {}

  private async verifyAnimalOwnership(animalId: number, ownerFarmerId: string): Promise<void> {
    const animal = await this.animalsRepository.findById(animalId);
    if (!animal) {
      throw new NotFoundException("Animal not found");
    }
    const farm = await this.farmsRepository.findById(animal.farmId);
    if (!farm) {
      throw new NotFoundException("Farm not found");
    }
    if (farm.ownerFarmerId !== ownerFarmerId) {
      throw new ForbiddenException("You do not own the farm this animal belongs to");
    }
  }

  private async verifyFarmOwnership(farmId: string, ownerFarmerId: string): Promise<void> {
    const farm = await this.farmsRepository.findById(farmId);
    if (!farm) {
      throw new NotFoundException("Farm not found");
    }
    if (farm.ownerFarmerId !== ownerFarmerId) {
      throw new ForbiddenException("You do not own this farm");
    }
  }

  async create(ownerFarmerId: string, dto: CreateMilkEntryDto): Promise<MilkEntry> {
    await this.verifyAnimalOwnership(dto.animalId, ownerFarmerId);

    return this.milkRepository.create({
      ...dto,
      quantity: dto.quantity.toString(),
      date: new Date(dto.date),
      fat: dto.fat ? dto.fat.toString() : null,
      snf: dto.snf ? dto.snf.toString() : null,
      notes: dto.notes || null,
    });
  }

  async update(ownerFarmerId: string, id: number, dto: UpdateMilkEntryDto): Promise<MilkEntry> {
    const entry = await this.milkRepository.findById(id);
    if (!entry) {
      throw new NotFoundException("Milk entry not found");
    }

    await this.verifyAnimalOwnership(entry.animalId, ownerFarmerId);

    const updates: Partial<MilkEntry> = {
      ...dto,
      quantity: dto.quantity ? dto.quantity.toString() : undefined,
      date: dto.date ? new Date(dto.date) : undefined,
      fat: dto.fat ? dto.fat.toString() : undefined,
      snf: dto.snf ? dto.snf.toString() : undefined,
    } as any;

    return this.milkRepository.update(id, updates);
  }

  async getAnimalHistory(ownerFarmerId: string, animalId: number): Promise<MilkEntry[]> {
    await this.verifyAnimalOwnership(animalId, ownerFarmerId);
    return this.milkRepository.getAnimalMilkHistory(animalId);
  }

  async getFarmHistory(ownerFarmerId: string, farmId: string): Promise<any[]> {
    await this.verifyFarmOwnership(farmId, ownerFarmerId);
    return this.milkRepository.getFarmMilkHistory(farmId);
  }

  async delete(ownerFarmerId: string, id: number): Promise<void> {
    const entry = await this.milkRepository.findById(id);
    if (!entry) {
      throw new NotFoundException("Milk entry not found");
    }
    await this.verifyAnimalOwnership(entry.animalId, ownerFarmerId);
    await this.milkRepository.delete(id);
  }
}
