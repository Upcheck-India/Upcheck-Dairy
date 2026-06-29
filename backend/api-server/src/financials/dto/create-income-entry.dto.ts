import { IsString, IsNotEmpty, IsOptional, IsNumber, IsUUID, IsDateString } from "class-validator";

export class CreateIncomeEntryDto {
  @IsUUID()
  @IsNotEmpty()
  farmId: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  buyer: string;

  @IsNumber()
  @IsNotEmpty()
  quantitySold: number;

  @IsNumber()
  @IsNotEmpty()
  ratePerLitre: number;

  @IsNumber()
  @IsNotEmpty()
  totalExpected: number;

  @IsNumber()
  @IsNotEmpty()
  totalReceived: number;

  @IsNumber()
  @IsOptional()
  fatPercentage?: number;

  @IsNumber()
  @IsOptional()
  snfPercentage?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
