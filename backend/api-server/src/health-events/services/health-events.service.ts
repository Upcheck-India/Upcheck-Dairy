import { Injectable, Inject, NotFoundException, ForbiddenException } from "@nestjs/common";
import { HealthEventsRepository } from "../repositories/health-events.repository";
import { AnimalsRepository } from "../../animals/repositories/animals.repository";
import { FarmsRepository } from "../../farms/repositories/farms.repository";
import { CreateHealthEventDto } from "../dto/create-health-event.dto";
import { UpdateHealthEventDto } from "../dto/update-health-event.dto";
import { type HealthEvent } from "@workspace/db";

@Injectable()
export class HealthEventsService {
  constructor(
    @Inject(HealthEventsRepository) private healthEventsRepository: HealthEventsRepository,
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

  async create(ownerFarmerId: string, dto: CreateHealthEventDto): Promise<HealthEvent> {
    await this.verifyAnimalOwnership(dto.animalId, ownerFarmerId);
    return this.healthEventsRepository.create({
      ...dto,
      date: new Date(dto.date),
      followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : null,
      cost: dto.cost ? dto.cost.toString() : null,
    });
  }

  async getAnimalHistory(ownerFarmerId: string, animalId: number): Promise<HealthEvent[]> {
    await this.verifyAnimalOwnership(animalId, ownerFarmerId);
    return this.healthEventsRepository.getAnimalHealthHistory(animalId);
  }

  async getFarmHistory(ownerFarmerId: string, farmId: string): Promise<any[]> {
    await this.verifyFarmOwnership(farmId, ownerFarmerId);
    return this.healthEventsRepository.getFarmHealthHistory(farmId);
  }

  async update(ownerFarmerId: string, id: number, dto: UpdateHealthEventDto): Promise<HealthEvent> {
    const event = await this.healthEventsRepository.findById(id);
    if (!event) {
      throw new NotFoundException("Health event not found");
    }
    await this.verifyAnimalOwnership(event.animalId, ownerFarmerId);

    const updates: Partial<HealthEvent> = {
      ...dto,
      date: dto.date ? new Date(dto.date) : undefined,
      followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : undefined,
      cost: dto.cost ? dto.cost.toString() : undefined,
    } as any;

    return this.healthEventsRepository.update(id, updates);
  }

  async delete(ownerFarmerId: string, id: number): Promise<void> {
    const event = await this.healthEventsRepository.findById(id);
    if (!event) {
      throw new NotFoundException("Health event not found");
    }
    await this.verifyAnimalOwnership(event.animalId, ownerFarmerId);
    await this.healthEventsRepository.delete(id);
  }
}
