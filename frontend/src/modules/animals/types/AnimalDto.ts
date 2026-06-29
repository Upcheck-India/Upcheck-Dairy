export interface AnimalResponseDto {
  id: number;
  farmId: string;
  name: string;
  type: "cow" | "buffalo" | "calf";
  breed: string;
  tagNumber: string | null;
  photoUri: string | null;
  healthStatus: "healthy" | "attention" | "critical";
  notes: string | null;
  birthDate: string | null;
  nextVaccinationDate: string | null;
  nextDeliveryDate: string | null;
  lactationNumber: number | null;
  lastCalvingDate: string | null;
  expectedCalvingDate: string | null;
  isPregnant: boolean;
  bodyConditionScore: string | number | null;
  weightKg: string | number | null;
  createdAt?: string;
  updatedAt?: string;
  lastMilkEntry?: { quantity: number; session: "morning" | "evening" } | null;
}

export interface CreateAnimalRequestDto {
  farmId: string;
  name: string;
  type: "cow" | "buffalo" | "calf";
  breed: string;
  tagNumber?: string;
  photoUri?: string;
  healthStatus?: "healthy" | "attention" | "critical";
  notes?: string;
  birthDate?: string;
  nextVaccinationDate?: string;
  nextDeliveryDate?: string;
  lactationNumber?: number;
  lastCalvingDate?: string;
  expectedCalvingDate?: string;
  isPregnant?: boolean;
  bodyConditionScore?: number;
  weightKg?: number;
}

export interface UpdateAnimalRequestDto extends Partial<Omit<CreateAnimalRequestDto, "farmId">> {}
