export interface HealthEventResponseDto {
  id: number;
  animalId: number;
  date: string;
  type: "vaccination" | "treatment" | "observation" | "diagnosis";
  description: string;
  veterinarianName: string | null;
  cost: string | number | null;
  followUpDate: string | null;
  createdAt: string;
}

export interface CreateHealthEventRequestDto {
  animalId: number;
  date: string;
  type: "vaccination" | "treatment" | "observation" | "diagnosis";
  description: string;
  veterinarianName?: string;
  cost?: number;
  followUpDate?: string;
}

export interface UpdateHealthEventRequestDto extends Partial<CreateHealthEventRequestDto> {}
