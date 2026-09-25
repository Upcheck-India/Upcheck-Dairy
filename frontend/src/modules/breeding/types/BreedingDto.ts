export interface BreedingEventResponseDto {
  id: number;
  animalId: number;
  eventType: "heat" | "insemination" | "pregnancy_confirmed" | "dry_off" | "calving" | "abort";
  date: string;
  note: string | null;
  /** Sire kept on this farm, when the bull is one of the farmer's own animals. */
  sireId: number | null;
  /** Sire label for AI straws or an outside bull. */
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
  sireId?: number | null;
  bullName?: string;
  expectedCalvingDate?: string;
  calvingGender?: string;
}

export interface UpdateBreedingEventRequestDto extends Partial<CreateBreedingEventRequestDto> {}
