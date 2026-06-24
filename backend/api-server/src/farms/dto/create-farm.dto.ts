import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class CreateFarmDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  location?: string;
}
