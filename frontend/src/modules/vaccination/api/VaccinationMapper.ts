import { Vaccination } from "../models/Vaccination";
import { VaccinationResponseDto } from "../types/VaccinationDto";

export class VaccinationMapper {
  static toDomain(dto: VaccinationResponseDto): Vaccination {
    return new Vaccination({
      id: dto.id.toString(),
      animalId: dto.animalId.toString(),
      vaccineName: dto.vaccineName,
      vaccineType: dto.vaccineType,
      scheduledDate: new Date(dto.scheduledDate),
      administeredDate: dto.administeredDate ? new Date(dto.administeredDate) : null,
      batchNo: dto.batchNo,
      administeredBy: dto.administeredBy,
      cost: dto.cost !== null ? Number(dto.cost) : null,
      nextDueDate: dto.nextDueDate ? new Date(dto.nextDueDate) : null,
      note: dto.note,
      createdAt: dto.createdAt ? new Date(dto.createdAt) : null,
    });
  }

  static toDomainList(dtos: VaccinationResponseDto[]): Vaccination[] {
    if (!Array.isArray(dtos)) return [];
    return dtos.map(dto => VaccinationMapper.toDomain(dto));
  }
}
