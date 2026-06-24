import { IsNotEmpty, IsNumber, IsEnum, IsDateString, IsOptional, IsString } from "class-validator";

export class CreateMilkEntryDto {
  @IsNumber()
  @IsNotEmpty()
  animalId: number;

  @IsEnum(["morning", "evening"])
  @IsNotEmpty()
  session: "morning" | "evening";

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsNumber()
  @IsOptional()
  fat?: number;

  @IsNumber()
  @IsOptional()
  snf?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
