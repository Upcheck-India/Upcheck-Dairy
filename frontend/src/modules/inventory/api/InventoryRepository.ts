import { apiClient } from "../../../core/api/ApiClient";
import { Storage } from "../../../core/storage/Storage";
import { InventoryItem } from "../models/InventoryItem";
import { InventoryMapper } from "./InventoryMapper";
import { InventoryItemResponseDto, CreateInventoryItemRequestDto, UpdateInventoryItemRequestDto } from "../types/InventoryDto";

export class InventoryRepository {
  private getCacheKey(farmId: string): string {
    return `upcheckdairy:${farmId}:inventory`;
  }

  async getInventoryItems(farmId: string): Promise<InventoryItem[]> {
    try {
      const dtos = await apiClient.get<InventoryItemResponseDto[]>("/inventory-items");
      const domainItems = InventoryMapper.toDomainList(dtos);
      await Storage.set(this.getCacheKey(farmId), dtos);
      return domainItems;
    } catch (e) {
      console.warn("[InventoryRepository] API fetch failed, falling back to local cache", e);
      const cachedDtos = await Storage.get<InventoryItemResponseDto[]>(this.getCacheKey(farmId));
      if (cachedDtos) {
        return InventoryMapper.toDomainList(cachedDtos);
      }
      return [];
    }
  }

  async createInventoryItem(dto: CreateInventoryItemRequestDto): Promise<InventoryItem> {
    const responseDto = await apiClient.post<InventoryItemResponseDto>("/inventory-items", dto);
    return InventoryMapper.toDomain(responseDto);
  }

  async updateInventoryItem(id: number, dto: UpdateInventoryItemRequestDto): Promise<InventoryItem> {
    const responseDto = await apiClient.put<InventoryItemResponseDto>(`/inventory-items/${id}`, dto);
    return InventoryMapper.toDomain(responseDto);
  }

  async deleteInventoryItem(id: number): Promise<void> {
    await apiClient.delete<void>(`/inventory-items/${id}`);
  }
}

export const inventoryRepository = new InventoryRepository();
