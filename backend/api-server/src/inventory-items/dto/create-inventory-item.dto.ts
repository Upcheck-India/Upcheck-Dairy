import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber, IsUUID } from "class-validator";

export class CreateInventoryItemDto {
  @IsUUID()
  @IsNotEmpty()
  farmId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(["feed", "medicine", "supplement", "equipment", "other"])
  @IsNotEmpty()
  category: "feed" | "medicine" | "supplement" | "equipment" | "other";

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsNumber()
  @IsNotEmpty()
  minQuantity: number;

  @IsNumber()
  @IsOptional()
  pricePerUnit?: number;
}
