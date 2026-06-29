export interface BreedingEventResponseDto {
  id: number;
  animalId: number;
  eventType: "heat" | "insemination" | "pregnancy_confirmed" | "dry_off" | "calving" | "abort";
  date: string;
  note: string | null;
  bullName: string | null;
  expectedCalvingDate: string | null;
  calvingGender: string | null;
  createdAt: string;
}

export interface CreateBreedingEventRequestDto {
  animalId: number;
  eventType: "heat" | "insemination" | "pregnancy_confirmed" | "dry_off" | "calving" | "abort";
  date: string;
  note?: string;
  bullName?: string;
  expectedCalvingDate?: string;
  calvingGender?: string;
}

export interface UpdateBreedingEventRequestDto extends Partial<CreateBreedingEventRequestDto> {}
