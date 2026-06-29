import { IsString, IsEnum, IsOptional, IsNumber, IsUUID } from "class-validator";

export class UpdateInventoryItemDto {
  @IsUUID()
  @IsOptional()
  farmId?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(["feed", "medicine", "supplement", "equipment", "other"])
  @IsOptional()
  category?: "feed" | "medicine" | "supplement" | "equipment" | "other";

  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsNumber()
  @IsOptional()
  minQuantity?: number;

  @IsNumber()
  @IsOptional()
  pricePerUnit?: number;
}
