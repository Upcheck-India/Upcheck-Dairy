import { apiClient } from "../../../core/api/ApiClient";
import { Storage } from "../../../core/storage/Storage";
import { HealthEvent } from "../models/HealthEvent";
import { HealthMapper } from "./HealthMapper";
import { HealthEventResponseDto, CreateHealthEventRequestDto, UpdateHealthEventRequestDto } from "../types/HealthDto";

export class HealthRepository {
  private getCacheKey(farmId: string): string {
    return `thulirfarm:${farmId}:health`;
  }

  async getHealthEvents(farmId: string): Promise<HealthEvent[]> {
    try {
      const dtos = await apiClient.get<HealthEventResponseDto[]>("/health-events");
      const domainEvents = HealthMapper.toDomainList(dtos);
      await Storage.set(this.getCacheKey(farmId), dtos);
      return domainEvents;
    } catch (e) {
      console.warn("[HealthRepository] API fetch failed, falling back to local cache", e);
      const cachedDtos = await Storage.get<HealthEventResponseDto[]>(this.getCacheKey(farmId));
      if (cachedDtos) {
        return HealthMapper.toDomainList(cachedDtos);
      }
      return [];
    }
  }

  async createHealthEvent(dto: CreateHealthEventRequestDto): Promise<HealthEvent> {
    const responseDto = await apiClient.post<HealthEventResponseDto>("/health-events", dto);
    return HealthMapper.toDomain(responseDto);
  }

  async updateHealthEvent(id: number, dto: UpdateHealthEventRequestDto): Promise<HealthEvent> {
    const responseDto = await apiClient.put<HealthEventResponseDto>(`/health-events/${id}`, dto);
    return HealthMapper.toDomain(responseDto);
  }

  async deleteHealthEvent(id: number): Promise<void> {
    await apiClient.delete<void>(`/health-events/${id}`);
  }
}

export const healthRepository = new HealthRepository();
