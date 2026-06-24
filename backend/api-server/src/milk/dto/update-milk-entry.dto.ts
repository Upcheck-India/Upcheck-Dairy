import { IsOptional, IsNumber, IsEnum, IsDateString, IsString } from "class-validator";

export class UpdateMilkEntryDto {
  @IsEnum(["morning", "evening"])
  @IsOptional()
  session?: "morning" | "evening";

  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsDateString()
  @IsOptional()
  date?: string;

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
