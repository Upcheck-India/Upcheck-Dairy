export interface VaccinationResponseDto {
  id: number;
  animalId: number;
  vaccineName: string;
  vaccineType: "FMD" | "HS" | "BQ" | "Brucellosis" | "Theileriosis" | "Anthrax" | "PPR" | "Other";
  scheduledDate: string;
  administeredDate: string | null;
  batchNo: string | null;
  administeredBy: string | null;
  cost: string | number | null;
  nextDueDate: string | null;
  note: string | null;
  createdAt: string;
}

export interface CreateVaccinationRequestDto {
  animalId: number;
  vaccineName: string;
  vaccineType: "FMD" | "HS" | "BQ" | "Brucellosis" | "Theileriosis" | "Anthrax" | "PPR" | "Other";
  scheduledDate: string;
  administeredDate?: string;
  batchNo?: string;
  administeredBy?: string;
  cost?: number;
  nextDueDate?: string;
  note?: string;
}

export interface UpdateVaccinationRequestDto extends Partial<CreateVaccinationRequestDto> {}
