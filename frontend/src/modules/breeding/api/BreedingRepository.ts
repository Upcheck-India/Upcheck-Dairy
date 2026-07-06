import { apiClient } from "../../../core/api/ApiClient";
import { Storage } from "../../../core/storage/Storage";
import { BreedingEvent } from "../models/BreedingEvent";
import { BreedingMapper } from "./BreedingMapper";
import { BreedingEventResponseDto, CreateBreedingEventRequestDto, UpdateBreedingEventRequestDto } from "../types/BreedingDto";

export class BreedingRepository {
  private getCacheKey(farmId: string): string {
    return `upcheckdairy:${farmId}:breeding`;
  }

  async getBreedingEvents(farmId: string): Promise<BreedingEvent[]> {
    try {
      const dtos = await apiClient.get<BreedingEventResponseDto[]>("/breeding-events");
      const domainEvents = BreedingMapper.toDomainList(dtos);
      await Storage.set(this.getCacheKey(farmId), dtos);
      return domainEvents;
    } catch (e) {
      console.warn("[BreedingRepository] API fetch failed, falling back to local cache", e);
      const cachedDtos = await Storage.get<BreedingEventResponseDto[]>(this.getCacheKey(farmId));
      if (cachedDtos) {
        return BreedingMapper.toDomainList(cachedDtos);
      }
      return [];
    }
  }

  async createBreedingEvent(dto: CreateBreedingEventRequestDto): Promise<BreedingEvent> {
    const responseDto = await apiClient.post<BreedingEventResponseDto>("/breeding-events", dto);
    return BreedingMapper.toDomain(responseDto);
  }

  async updateBreedingEvent(id: number, dto: UpdateBreedingEventRequestDto): Promise<BreedingEvent> {
    const responseDto = await apiClient.put<BreedingEventResponseDto>(`/breeding-events/${id}`, dto);
    return BreedingMapper.toDomain(responseDto);
  }

  async deleteBreedingEvent(id: number): Promise<void> {
    await apiClient.delete<void>(`/breeding-events/${id}`);
  }
}

export const breedingRepository = new BreedingRepository();
