import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber, IsDateString } from "class-validator";

export class CreateVaccinationDto {
  @IsNumber()
  @IsNotEmpty()
  animalId: number;

  @IsString()
  @IsNotEmpty()
  vaccineName: string;

  @IsEnum(["FMD", "HS", "BQ", "Brucellosis", "Theileriosis", "Anthrax", "PPR", "Other"])
  @IsNotEmpty()
  vaccineType: "FMD" | "HS" | "BQ" | "Brucellosis" | "Theileriosis" | "Anthrax" | "PPR" | "Other";

  @IsDateString()
  @IsNotEmpty()
  scheduledDate: string;

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
