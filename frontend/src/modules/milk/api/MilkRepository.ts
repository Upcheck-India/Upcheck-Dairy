import { apiClient } from "../../../core/api/ApiClient";
import { Storage } from "../../../core/storage/Storage";
import { MilkEntry } from "../models/MilkEntry";
import { MilkMapper } from "./MilkMapper";
import { MilkEntryResponseDto, CreateMilkEntryRequestDto, UpdateMilkEntryRequestDto } from "../types/MilkDto";

export class MilkRepository {
  private getCacheKey(farmId: string): string {
    return `thulirfarm:${farmId}:milk`;
  }

  async getMilk(farmId: string): Promise<MilkEntry[]> {
    try {
      const dtos = await apiClient.get<MilkEntryResponseDto[]>("/milk");
      const domainMilk = MilkMapper.toDomainList(dtos);
      await Storage.set(this.getCacheKey(farmId), dtos);
      return domainMilk;
    } catch (e) {
      console.warn("[MilkRepository] API fetch failed, falling back to local cache", e);
      const cachedDtos = await Storage.get<MilkEntryResponseDto[]>(this.getCacheKey(farmId));
      if (cachedDtos) {
        return MilkMapper.toDomainList(cachedDtos);
      }
      return [];
    }
  }

  async createMilkEntry(dto: CreateMilkEntryRequestDto): Promise<MilkEntry> {
    const responseDto = await apiClient.post<MilkEntryResponseDto>("/milk", dto);
    return MilkMapper.toDomain(responseDto);
  }

  async updateMilkEntry(id: number, dto: UpdateMilkEntryRequestDto): Promise<MilkEntry> {
    const responseDto = await apiClient.put<MilkEntryResponseDto>(`/milk/${id}`, dto);
    return MilkMapper.toDomain(responseDto);
  }

  async deleteMilkEntry(id: number): Promise<void> {
    await apiClient.delete<void>(`/milk/${id}`);
  }
}

export const milkRepository = new MilkRepository();
