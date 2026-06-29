import { MilkEntry } from "../models/MilkEntry";
import { MilkEntryResponseDto } from "../types/MilkDto";

export class MilkMapper {
  static toDomain(dto: MilkEntryResponseDto): MilkEntry {
    return new MilkEntry({
      id: dto.id.toString(),
      animalId: dto.animalId.toString(),
      session: dto.session,
      quantity: Number(dto.quantity),
      date: new Date(dto.date),
      fat: dto.fat !== null ? Number(dto.fat) : null,
      snf: dto.snf !== null ? Number(dto.snf) : null,
      notes: dto.notes,
      createdAt: dto.createdAt ? new Date(dto.createdAt) : null,
    });
  }

  static toDomainList(dtos: MilkEntryResponseDto[]): MilkEntry[] {
    if (!Array.isArray(dtos)) return [];
    return dtos.map(dto => MilkMapper.toDomain(dto));
  }
}
