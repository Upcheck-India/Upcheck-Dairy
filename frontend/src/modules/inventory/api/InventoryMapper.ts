import { InventoryItem } from "../models/InventoryItem";
import { InventoryItemResponseDto } from "../types/InventoryDto";

export class InventoryMapper {
  static toDomain(dto: InventoryItemResponseDto): InventoryItem {
    return new InventoryItem({
      id: dto.id.toString(),
      farmId: dto.farmId,
      name: dto.name,
      category: dto.category,
      quantity: Number(dto.quantity),
      unit: dto.unit,
      minQuantity: Number(dto.minQuantity),
      pricePerUnit: dto.pricePerUnit !== null ? Number(dto.pricePerUnit) : null,
      lastUpdated: new Date(dto.lastUpdated),
      createdAt: dto.createdAt ? new Date(dto.createdAt) : null,
    });
  }

  static toDomainList(dtos: InventoryItemResponseDto[]): InventoryItem[] {
    if (!Array.isArray(dtos)) return [];
    return dtos.map(dto => InventoryMapper.toDomain(dto));
  }
}
