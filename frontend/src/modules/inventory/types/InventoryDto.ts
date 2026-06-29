export interface InventoryItemResponseDto {
  id: number;
  farmId: string;
  name: string;
  category: "feed" | "medicine" | "supplement" | "equipment" | "other";
  quantity: string | number;
  unit: string;
  minQuantity: string | number;
  pricePerUnit: string | number | null;
  lastUpdated: string;
  createdAt: string;
}

export interface CreateInventoryItemRequestDto {
  farmId: string;
  name: string;
  category: "feed" | "medicine" | "supplement" | "equipment" | "other";
  quantity: number;
  unit: string;
  minQuantity: number;
  pricePerUnit?: number;
}

export interface UpdateInventoryItemRequestDto extends Partial<CreateInventoryItemRequestDto> {}
