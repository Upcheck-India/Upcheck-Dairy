import { IsString, IsNotEmpty, IsOptional, IsNumber, IsUUID, IsDateString, IsEnum } from "class-validator";

export class CreateExpenseEntryDto {
  @IsUUID()
  @IsNotEmpty()
  farmId: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsEnum(["feed", "medicine", "labor", "equipment", "other"])
  @IsNotEmpty()
  category: "feed" | "medicine" | "labor" | "equipment" | "other";

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsOptional()
  attachmentUrl?: string;
}
