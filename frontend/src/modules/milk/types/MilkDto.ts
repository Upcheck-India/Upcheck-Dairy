export interface MilkEntryResponseDto {
  id: number;
  animalId: number;
  session: "morning" | "evening";
  quantity: string | number;
  date: string;
  fat: string | number | null;
  snf: string | number | null;
  notes: string | null;
  createdAt: string;
}

export interface CreateMilkEntryRequestDto {
  animalId: number;
  session: "morning" | "evening";
  quantity: number;
  date: string;
  fat?: number;
  snf?: number;
  notes?: string;
}

export interface UpdateMilkEntryRequestDto extends Partial<CreateMilkEntryRequestDto> {}
