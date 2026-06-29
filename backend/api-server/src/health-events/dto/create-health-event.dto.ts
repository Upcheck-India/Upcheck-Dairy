import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber, IsDateString } from "class-validator";

export class CreateHealthEventDto {
  @IsNumber()
  @IsNotEmpty()
  animalId: number;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsEnum(["vaccination", "treatment", "observation", "diagnosis"])
  @IsNotEmpty()
  type: "vaccination" | "treatment" | "observation" | "diagnosis";

  @IsString()
  @IsNotEmpty()
  description: string;

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
