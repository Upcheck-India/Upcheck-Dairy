import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber, IsBoolean, IsDateString, IsUUID } from "class-validator";

export class CreateAnimalDto {
  @IsUUID()
  @IsNotEmpty()
  farmId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(["cow", "buffalo", "calf"])
  @IsNotEmpty()
  type: "cow" | "buffalo" | "calf";

  @IsString()
  @IsNotEmpty()
  breed: string;

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
}
