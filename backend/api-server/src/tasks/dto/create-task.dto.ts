import { IsString, IsNotEmpty, IsEnum, IsOptional, IsBoolean, IsDateString, IsUUID, IsNumber } from "class-validator";

export class CreateTaskDto {
  @IsUUID()
  @IsNotEmpty()
  farmId: string;

  @IsNumber()
  @IsOptional()
  animalId?: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  titleTamil: string;

  @IsString()
  @IsNotEmpty()
  time: string;

  @IsString()
  @IsNotEmpty()
  session: string;

  @IsBoolean()
  @IsOptional()
  completed?: boolean;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsEnum(["milk", "feed", "health", "clean", "other", "breeding", "vaccination"])
  @IsNotEmpty()
  type: "milk" | "feed" | "health" | "clean" | "other" | "breeding" | "vaccination";

  @IsEnum(["low", "normal", "high", "critical"])
  @IsOptional()
  priority?: "low" | "normal" | "high" | "critical";
}
