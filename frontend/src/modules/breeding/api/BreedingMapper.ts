import { BreedingEvent } from "../models/BreedingEvent";
import { BreedingEventResponseDto } from "../types/BreedingDto";

export class BreedingMapper {
  static toDomain(dto: BreedingEventResponseDto): BreedingEvent {
    return new BreedingEvent({
      id: dto.id.toString(),
      animalId: dto.animalId.toString(),
      eventType: dto.eventType,
      date: new Date(dto.date),
      note: dto.note,
      sireId: dto.sireId != null ? dto.sireId.toString() : null,
      bullName: dto.bullName,
      expectedCalvingDate: dto.expectedCalvingDate ? new Date(dto.expectedCalvingDate) : null,
      calvingGender: dto.calvingGender,
      createdAt: dto.createdAt ? new Date(dto.createdAt) : null,
    });
  }

  static toDomainList(dtos: BreedingEventResponseDto[]): BreedingEvent[] {
    if (!Array.isArray(dtos)) return [];
    return dtos.map(dto => BreedingMapper.toDomain(dto));
  }
}
