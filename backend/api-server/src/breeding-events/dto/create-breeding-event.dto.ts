import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber, IsDateString } from "class-validator";

export class CreateBreedingEventDto {
  @IsNumber()
  @IsNotEmpty()
  animalId: number;

  @IsEnum(["heat", "insemination", "pregnancy_confirmed", "dry_off", "calving", "abort"])
  @IsNotEmpty()
  eventType: "heat" | "insemination" | "pregnancy_confirmed" | "dry_off" | "calving" | "abort";

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsOptional()
  note?: string;

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
