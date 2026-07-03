import { IsString, IsEnum, IsOptional, IsBoolean, IsDateString, IsUUID, IsNumber } from "class-validator";

export class UpdateTaskDto {
  @IsUUID()
  @IsOptional()
  farmId?: string;

  @IsNumber()
  @IsOptional()
  animalId?: number;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  time?: string;

  @IsString()
  @IsOptional()
  session?: string;

  @IsBoolean()
  @IsOptional()
  completed?: boolean;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsEnum(["milk", "feed", "health", "clean", "other", "breeding", "vaccination"])
  @IsOptional()
  type?: "milk" | "feed" | "health" | "clean" | "other" | "breeding" | "vaccination";

  @IsEnum(["low", "normal", "high", "critical"])
  @IsOptional()
  priority?: "low" | "normal" | "high" | "critical";
}
