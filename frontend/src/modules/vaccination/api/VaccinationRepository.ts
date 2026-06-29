import { apiClient } from "../../../core/api/ApiClient";
import { Storage } from "../../../core/storage/Storage";
import { Vaccination } from "../models/Vaccination";
import { VaccinationMapper } from "./VaccinationMapper";
import { VaccinationResponseDto, CreateVaccinationRequestDto, UpdateVaccinationRequestDto } from "../types/VaccinationDto";

export class VaccinationRepository {
  private getCacheKey(farmId: string): string {
    return `thulirfarm:${farmId}:vaccinations`;
  }

  async getVaccinations(farmId: string): Promise<Vaccination[]> {
    try {
      const dtos = await apiClient.get<VaccinationResponseDto[]>("/vaccinations");
      const domainEvents = VaccinationMapper.toDomainList(dtos);
      await Storage.set(this.getCacheKey(farmId), dtos);
      return domainEvents;
    } catch (e) {
      console.warn("[VaccinationRepository] API fetch failed, falling back to local cache", e);
      const cachedDtos = await Storage.get<VaccinationResponseDto[]>(this.getCacheKey(farmId));
      if (cachedDtos) {
        return VaccinationMapper.toDomainList(cachedDtos);
      }
      return [];
    }
  }

  async createVaccination(dto: CreateVaccinationRequestDto): Promise<Vaccination> {
    const responseDto = await apiClient.post<VaccinationResponseDto>("/vaccinations", dto);
    return VaccinationMapper.toDomain(responseDto);
  }

  async updateVaccination(id: number, dto: UpdateVaccinationRequestDto): Promise<Vaccination> {
    const responseDto = await apiClient.put<VaccinationResponseDto>(`/vaccinations/${id}`, dto);
    return VaccinationMapper.toDomain(responseDto);
  }

  async deleteVaccination(id: number): Promise<void> {
    await apiClient.delete<void>(`/vaccinations/${id}`);
  }
}

export const vaccinationRepository = new VaccinationRepository();
