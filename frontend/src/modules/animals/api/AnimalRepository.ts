import { apiClient } from "../../../core/api/ApiClient";
import { Storage } from "../../../core/storage/Storage";
import { Animal } from "../models/Animal";
import { AnimalMapper } from "./AnimalMapper";
import { AnimalResponseDto, CreateAnimalRequestDto, UpdateAnimalRequestDto } from "../types/AnimalDto";

export class AnimalRepository {
  private getCacheKey(farmId: string): string {
    return `upcheckdairy:${farmId}:animals`;
  }

  async getAnimals(farmId: string): Promise<Animal[]> {
    try {
      const dtos = await apiClient.get<AnimalResponseDto[]>("/animals");
      const domainAnimals = AnimalMapper.toDomainList(dtos);
      await Storage.set(this.getCacheKey(farmId), dtos);
      return domainAnimals;
    } catch (e) {
      console.warn("[AnimalRepository] API fetch failed, falling back to local cache", e);
      const cachedDtos = await Storage.get<AnimalResponseDto[]>(this.getCacheKey(farmId));
      if (cachedDtos) {
        return AnimalMapper.toDomainList(cachedDtos);
      }
      return [];
    }
  }

  async getAnimal(id: number): Promise<Animal> {
    const dto = await apiClient.get<AnimalResponseDto>(`/animals/${id}`);
    return AnimalMapper.toDomain(dto);
  }

  async createAnimal(dto: CreateAnimalRequestDto): Promise<Animal> {
    const responseDto = await apiClient.post<AnimalResponseDto>("/animals", dto);
    return AnimalMapper.toDomain(responseDto);
  }

  async updateAnimal(id: number, dto: UpdateAnimalRequestDto): Promise<Animal> {
    const responseDto = await apiClient.put<AnimalResponseDto>(`/animals/${id}`, dto);
    return AnimalMapper.toDomain(responseDto);
  }

  async deleteAnimal(id: number): Promise<void> {
    await apiClient.delete<void>(`/animals/${id}`);
  }
}

export const animalRepository = new AnimalRepository();
