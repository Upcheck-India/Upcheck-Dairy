import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean, IsDateString, IsNotEmpty, MaxLength } from "class-validator";

export class UpdateAnimalDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(["cow", "buffalo", "calf"])
  @IsOptional()
  type?: "cow" | "buffalo" | "calf";

  @IsString()
  @IsOptional()
  breed?: string;

  @IsString()
  @IsOptional()
  tagNumber?: string;

  @IsString()
  @IsOptional()
  photoUri?: string;

  @IsEnum(["healthy", "attention", "critical"])
  @IsOptional()
  healthStatus?: "healthy" | "attention" | "critical";

  @IsString()
  @IsOptional()
  notes?: string;

  @IsDateString()
  @IsOptional()
  birthDate?: string;

  @IsDateString()
  @IsOptional()
  nextVaccinationDate?: string;

  @IsDateString()
  @IsOptional()
  nextDeliveryDate?: string;

  @IsNumber()
  @IsOptional()
  lactationNumber?: number;

  @IsDateString()
  @IsOptional()
  lastCalvingDate?: string;

  @IsDateString()
  @IsOptional()
  expectedCalvingDate?: string;

  @IsBoolean()
  @IsOptional()
  isPregnant?: boolean;

  @IsNumber()
  @IsOptional()
  bodyConditionScore?: number;

  @IsNumber()
  @IsOptional()
  weightKg?: number;

  @IsString()
  @IsOptional()
  shed?: string;

  // Free text: see CreateAnimalDto.status.
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  gender?: string;
}
