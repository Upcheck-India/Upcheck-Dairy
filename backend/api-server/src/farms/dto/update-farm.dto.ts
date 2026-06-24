import { IsString, IsOptional } from "class-validator";

export class UpdateFarmDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  location?: string;
}
