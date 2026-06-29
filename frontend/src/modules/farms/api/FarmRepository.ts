import { Repository } from "../../../shared/types/Repository";
import { apiClient } from "../../../core/api/ApiClient";
import { Storage } from "../../../core/storage/Storage";
import { Farm } from "../models/Farm";
import { FarmMapper, FarmDTO } from "./FarmMapper";

export class FarmRepository implements Repository<Farm, { name: string; location?: string }, { name?: string; location?: string }> {
  
  async fetch(): Promise<Farm[]> {
    const dtos = await apiClient.get<FarmDTO[]>("/farms");
    return FarmMapper.toDomainList(dtos);
  }

  async create(dto: { name: string; location?: string }): Promise<Farm> {
    const responseDto = await apiClient.post<FarmDTO>("/farms", dto);
    return FarmMapper.toDomain(responseDto);
  }

  async update(id: string, dto: { name?: string; location?: string }): Promise<Farm> {
    const responseDto = await apiClient.put<FarmDTO>(`/farms/${id}`, dto);
    return FarmMapper.toDomain(responseDto);
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete<void>(`/farms/${id}`);
  }

  async getActiveFarmId(): Promise<string | null> {
    return Storage.activeFarm.load();
  }

  async setActiveFarmId(id: string | null): Promise<void> {
    if (id) {
      await Storage.activeFarm.save(id);
    } else {
      await Storage.activeFarm.clear();
    }
  }
}

export const farmRepository = new FarmRepository();
