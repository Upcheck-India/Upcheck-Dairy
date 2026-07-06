import { apiClient } from "../../../core/api/ApiClient";
import { Storage } from "../../../core/storage/Storage";
import { MilkEntry } from "../models/MilkEntry";
import { MilkMapper } from "./MilkMapper";
import { MilkEntryResponseDto, CreateMilkEntryRequestDto, UpdateMilkEntryRequestDto, PendingMilkWrite } from "../types/MilkDto";
import NetInfo from "@react-native-community/netinfo";

export class MilkRepository {
  private getCacheKey(farmId: string): string {
    return `upcheckdairy:${farmId}:milk`;
  }

  private async queuePendingWrite(farmId: string, write: PendingMilkWrite) {
    const queueKey = `upcheckdairy:${farmId}:pending_milk_writes`;
    const currentQueue = await Storage.get<PendingMilkWrite[]>(queueKey) || [];
    currentQueue.push(write);
    await Storage.set(queueKey, currentQueue);
  }

  private async updateLocalCache(farmId: string, action: PendingMilkWrite) {
    const cacheKey = this.getCacheKey(farmId);
    const cached = await Storage.get<MilkEntryResponseDto[]>(cacheKey) || [];
    let updated = [...cached];
    if (action.type === "create" && action.data) {
      const data = action.data as CreateMilkEntryRequestDto;
      const newDto: MilkEntryResponseDto = {
        id: Number(action.tempId),
        animalId: Number(data.animalId),
        session: data.session,
        quantity: data.quantity.toString(),
        date: data.date,
        fat: data.fat ? data.fat.toString() : null,
        snf: data.snf ? data.snf.toString() : null,
        notes: data.notes || null,
        createdAt: new Date().toISOString(),
      };
      updated = [newDto, ...updated];
    } else if (action.type === "update" && action.data) {
      const data = action.data as UpdateMilkEntryRequestDto;
      updated = updated.map(item => {
        if (item.id.toString() === action.id) {
          return {
            ...item,
            session: data.session ?? item.session,
            quantity: data.quantity !== undefined ? data.quantity.toString() : item.quantity,
            fat: data.fat !== undefined ? (data.fat ? data.fat.toString() : null) : item.fat,
            snf: data.snf !== undefined ? (data.snf ? data.snf.toString() : null) : item.snf,
            notes: data.notes !== undefined ? (data.notes || null) : item.notes,
          };
        }
        return item;
      });
    } else if (action.type === "delete") {
      updated = updated.filter(item => item.id.toString() !== action.id);
    }
    await Storage.set(cacheKey, updated);
  }

  async getMilk(farmId: string): Promise<MilkEntry[]> {
    try {
      const dtos = await apiClient.get<MilkEntryResponseDto[]>("/milk");
      const domainMilk = MilkMapper.toDomainList(dtos);
      await Storage.set(this.getCacheKey(farmId), dtos);
      return domainMilk;
    } catch (e) {
      console.warn("[MilkRepository] API fetch failed, falling back to local cache", e);
      const cachedDtos = await Storage.get<MilkEntryResponseDto[]>(this.getCacheKey(farmId));
      if (cachedDtos) {
        return MilkMapper.toDomainList(cachedDtos);
      }
      return [];
    }
  }

  async createMilkEntry(dto: CreateMilkEntryRequestDto, farmId: string): Promise<MilkEntry> {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      const tempId = (Date.now() * -1).toString();
      await this.queuePendingWrite(farmId, { type: "create", data: dto, tempId });
      await this.updateLocalCache(farmId, { type: "create", data: dto, tempId });
      return MilkMapper.toDomain({
        id: Number(tempId),
        animalId: Number(dto.animalId),
        session: dto.session,
        quantity: dto.quantity.toString(),
        date: dto.date || new Date().toISOString(),
        fat: dto.fat ? dto.fat.toString() : null,
        snf: dto.snf ? dto.snf.toString() : null,
        notes: dto.notes || null,
        createdAt: new Date().toISOString(),
      });
    }
    const responseDto = await apiClient.post<MilkEntryResponseDto>("/milk", dto);
    const cacheKey = this.getCacheKey(farmId);
    const cached = await Storage.get<MilkEntryResponseDto[]>(cacheKey) || [];
    await Storage.set(cacheKey, [responseDto, ...cached]);
    return MilkMapper.toDomain(responseDto);
  }

  async updateMilkEntry(id: number, dto: UpdateMilkEntryRequestDto, farmId: string): Promise<MilkEntry> {
    const state = await NetInfo.fetch();
    if (!state.isConnected || id < 0) {
      await this.queuePendingWrite(farmId, { type: "update", data: dto, id: id.toString() });
      await this.updateLocalCache(farmId, { type: "update", data: dto, id: id.toString() });
      const cacheKey = this.getCacheKey(farmId);
      const cached = await Storage.get<MilkEntryResponseDto[]>(cacheKey) || [];
      const item = cached.find(x => x.id === id);
      if (item) {
        return MilkMapper.toDomain(item);
      }
      throw new Error("Local entry not found for update");
    }
    const responseDto = await apiClient.put<MilkEntryResponseDto>(`/milk/${id}`, dto);
    const cacheKey = this.getCacheKey(farmId);
    const cached = await Storage.get<MilkEntryResponseDto[]>(cacheKey) || [];
    const updated = cached.map(x => x.id === id ? responseDto : x);
    await Storage.set(cacheKey, updated);
    return MilkMapper.toDomain(responseDto);
  }

  async deleteMilkEntry(id: number, farmId: string): Promise<void> {
    const state = await NetInfo.fetch();
    if (!state.isConnected || id < 0) {
      await this.queuePendingWrite(farmId, { type: "delete", id: id.toString() });
      await this.updateLocalCache(farmId, { type: "delete", id: id.toString() });
      return;
    }
    await apiClient.delete<void>(`/milk/${id}`);
    const cacheKey = this.getCacheKey(farmId);
    const cached = await Storage.get<MilkEntryResponseDto[]>(cacheKey) || [];
    await Storage.set(cacheKey, cached.filter(x => x.id !== id));
  }
}

export const milkRepository = new MilkRepository();
