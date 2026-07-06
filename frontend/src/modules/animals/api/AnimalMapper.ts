import { Animal } from "../models/Animal";
import { AnimalResponseDto } from "../types/AnimalDto";

export class AnimalMapper {
  static toDomain(dto: AnimalResponseDto): Animal {
    return new Animal({
      id: dto.id.toString(),
      farmId: dto.farmId,
      name: dto.name,
      type: dto.type,
      breed: dto.breed,
      tagNumber: dto.tagNumber,
      photoUri: dto.photoUri && dto.photoUri.startsWith("/uploads")
        ? (process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api").replace(/\/api$/, "") + dto.photoUri
        : dto.photoUri,
      healthStatus: dto.healthStatus,
      notes: dto.notes,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
      nextVaccinationDate: dto.nextVaccinationDate ? new Date(dto.nextVaccinationDate) : null,
      nextDeliveryDate: dto.nextDeliveryDate ? new Date(dto.nextDeliveryDate) : null,
      lactationNumber: dto.lactationNumber,
      lastCalvingDate: dto.lastCalvingDate ? new Date(dto.lastCalvingDate) : null,
      expectedCalvingDate: dto.expectedCalvingDate ? new Date(dto.expectedCalvingDate) : null,
      isPregnant: dto.isPregnant,
      bodyConditionScore: dto.bodyConditionScore ? Number(dto.bodyConditionScore) : null,
      weightKg: dto.weightKg ? Number(dto.weightKg) : null,
      createdAt: dto.createdAt ? new Date(dto.createdAt) : null,
      updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : null,
      lastMilkEntry: dto.lastMilkEntry,
    });
  }

  static toDomainList(dtos: AnimalResponseDto[]): Animal[] {
    if (!Array.isArray(dtos)) return [];
    return dtos.map(dto => AnimalMapper.toDomain(dto));
  }
}
