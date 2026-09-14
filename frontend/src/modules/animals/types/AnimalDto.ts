/**
 * The category an animal belongs to. Free text, because farmers can define their
 * own categories; the seeded ones are in DEFAULT_CATEGORIES (CategoryProvider).
 */
export type AnimalStatus = string;

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
  shed?: string | null;
  status?: AnimalStatus | null;
  gender?: string | null;
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
  shed?: string;
  status?: AnimalStatus;
  gender?: string;
}

export interface UpdateAnimalRequestDto extends Partial<Omit<CreateAnimalRequestDto, "farmId">> {}
