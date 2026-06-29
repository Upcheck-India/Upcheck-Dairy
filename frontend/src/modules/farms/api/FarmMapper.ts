import { Farm } from "../models/Farm";

export interface FarmDTO {
  id: string;
  ownerFarmerId: string;
  name: string;
  location?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export class FarmMapper {
  static toDomain(dto: FarmDTO): Farm {
    return new Farm({
      id: dto.id,
      ownerId: dto.ownerFarmerId,
      name: dto.name,
      location: dto.location,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  static toDomainList(dtos: FarmDTO[]): Farm[] {
    if (!Array.isArray(dtos)) return [];
    return dtos.map(dto => FarmMapper.toDomain(dto));
  }
}
