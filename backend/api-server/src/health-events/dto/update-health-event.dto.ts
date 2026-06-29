import { IsString, IsEnum, IsOptional, IsNumber, IsDateString } from "class-validator";

export class UpdateHealthEventDto {
  @IsNumber()
  @IsOptional()
  animalId?: number;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsEnum(["vaccination", "treatment", "observation", "diagnosis"])
  @IsOptional()
  type?: "vaccination" | "treatment" | "observation" | "diagnosis";

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  veterinarianName?: string;

  @IsNumber()
  @IsOptional()
  cost?: number;

  @IsDateString()
  @IsOptional()
  followUpDate?: string;
}
