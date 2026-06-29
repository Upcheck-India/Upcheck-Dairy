import { HealthEvent } from "../models/HealthEvent";
import { HealthEventResponseDto } from "../types/HealthDto";

export class HealthMapper {
  static toDomain(dto: HealthEventResponseDto): HealthEvent {
    return new HealthEvent({
      id: dto.id.toString(),
      animalId: dto.animalId.toString(),
      date: new Date(dto.date),
      type: dto.type,
      description: dto.description,
      veterinarianName: dto.veterinarianName,
      cost: dto.cost !== null ? Number(dto.cost) : null,
      followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : null,
      createdAt: dto.createdAt ? new Date(dto.createdAt) : null,
    });
  }

  static toDomainList(dtos: HealthEventResponseDto[]): HealthEvent[] {
    if (!Array.isArray(dtos)) return [];
    return dtos.map(dto => HealthMapper.toDomain(dto));
  }
}
