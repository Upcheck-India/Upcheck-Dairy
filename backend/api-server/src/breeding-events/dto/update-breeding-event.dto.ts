import { IsString, IsEnum, IsOptional, IsNumber, IsDateString } from "class-validator";

export class UpdateBreedingEventDto {
  @IsNumber()
  @IsOptional()
  animalId?: number;

  @IsEnum(["heat", "insemination", "pregnancy_confirmed", "dry_off", "calving", "abort"])
  @IsOptional()
  eventType?: "heat" | "insemination" | "pregnancy_confirmed" | "dry_off" | "calving" | "abort";

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsNumber()
  @IsOptional()
  sireId?: number | null;

  @IsString()
  @IsOptional()
  bullName?: string;

  @IsDateString()
  @IsOptional()
  expectedCalvingDate?: string;

  @IsString()
  @IsOptional()
  calvingGender?: string;
}
