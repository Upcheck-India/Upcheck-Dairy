import { IsString, IsEnum, IsOptional, IsNumber, IsDateString } from "class-validator";

export class UpdateVaccinationDto {
  @IsNumber()
  @IsOptional()
  animalId?: number;

  @IsString()
  @IsOptional()
  vaccineName?: string;

  @IsEnum(["FMD", "HS", "BQ", "Brucellosis", "Theileriosis", "Anthrax", "PPR", "Other"])
  @IsOptional()
  vaccineType?: "FMD" | "HS" | "BQ" | "Brucellosis" | "Theileriosis" | "Anthrax" | "PPR" | "Other";

  @IsDateString()
  @IsOptional()
  scheduledDate?: string;

  @IsDateString()
  @IsOptional()
  administeredDate?: string;

  @IsString()
  @IsOptional()
  batchNo?: string;

  @IsString()
  @IsOptional()
  administeredBy?: string;

  @IsNumber()
  @IsOptional()
  cost?: number;

  @IsDateString()
  @IsOptional()
  nextDueDate?: string;

  @IsString()
  @IsOptional()
  note?: string;
}
