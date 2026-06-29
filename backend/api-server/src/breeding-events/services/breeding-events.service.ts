import { Injectable, Inject, NotFoundException, ForbiddenException } from "@nestjs/common";
import { BreedingEventsRepository } from "../repositories/breeding-events.repository";
import { AnimalsRepository } from "../../animals/repositories/animals.repository";
import { FarmsRepository } from "../../farms/repositories/farms.repository";
import { CreateBreedingEventDto } from "../dto/create-breeding-event.dto";
import { UpdateBreedingEventDto } from "../dto/update-breeding-event.dto";
import { type BreedingEvent } from "@workspace/db";

@Injectable()
export class BreedingEventsService {
  constructor(
    @Inject(BreedingEventsRepository) private breedingEventsRepository: BreedingEventsRepository,
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

  async create(ownerFarmerId: string, dto: CreateBreedingEventDto): Promise<BreedingEvent> {
    await this.verifyAnimalOwnership(dto.animalId, ownerFarmerId);
    return this.breedingEventsRepository.create({
      ...dto,
      date: new Date(dto.date),
      expectedCalvingDate: dto.expectedCalvingDate ? new Date(dto.expectedCalvingDate) : null,
      note: dto.note || null,
      bullName: dto.bullName || null,
      calvingGender: dto.calvingGender || null,
    });
  }

  async getAnimalHistory(ownerFarmerId: string, animalId: number): Promise<BreedingEvent[]> {
    await this.verifyAnimalOwnership(animalId, ownerFarmerId);
    return this.breedingEventsRepository.getAnimalBreedingHistory(animalId);
  }

  async getFarmHistory(ownerFarmerId: string, farmId: string): Promise<any[]> {
    await this.verifyFarmOwnership(farmId, ownerFarmerId);
    return this.breedingEventsRepository.getFarmBreedingHistory(farmId);
  }

  async update(ownerFarmerId: string, id: number, dto: UpdateBreedingEventDto): Promise<BreedingEvent> {
    const event = await this.breedingEventsRepository.findById(id);
    if (!event) {
      throw new NotFoundException("Breeding event not found");
    }
    await this.verifyAnimalOwnership(event.animalId, ownerFarmerId);

    const updates: Partial<BreedingEvent> = {
      ...dto,
      date: dto.date ? new Date(dto.date) : undefined,
      expectedCalvingDate: dto.expectedCalvingDate ? new Date(dto.expectedCalvingDate) : undefined,
    } as any;

    return this.breedingEventsRepository.update(id, updates);
  }

  async delete(ownerFarmerId: string, id: number): Promise<void> {
    const event = await this.breedingEventsRepository.findById(id);
    if (!event) {
      throw new NotFoundException("Breeding event not found");
    }
    await this.verifyAnimalOwnership(event.animalId, ownerFarmerId);
    await this.breedingEventsRepository.delete(id);
  }
}
