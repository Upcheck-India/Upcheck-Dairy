import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { MilkEntry } from "../models/MilkEntry";
import { milkRepository } from "../api/MilkRepository";
import { CreateMilkEntryRequestDto, UpdateMilkEntryRequestDto, PendingMilkWrite } from "../types/MilkDto";
import { useFarm } from "../../../modules/farms/hooks/useFarm";
import { Storage } from "../../../core/storage/Storage";
import { apiClient } from "../../../core/api/ApiClient";
import NetInfo from "@react-native-community/netinfo";

interface MilkContextType {
  loading: boolean;
  error: Error | null;
  milkEntries: MilkEntry[];
  createMilk: (dto: CreateMilkEntryRequestDto) => Promise<MilkEntry>;
  updateMilk: (id: number, dto: UpdateMilkEntryRequestDto) => Promise<MilkEntry>;
  removeMilk: (id: number) => Promise<void>;
  refresh: () => Promise<void>;
}

const MilkContext = createContext<MilkContextType | null>(null);

export function MilkProvider({ children }: { children: React.ReactNode }) {
  const { activeFarm } = useFarm();
  const [milkEntries, setMilkEntries] = useState<MilkEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchMilk = useCallback(async (farmId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await milkRepository.getMilk(farmId);
      setMilkEntries(data);
    } catch (e: any) {
      setError(e instanceof Error ? e : new Error(e.message || "Failed to load milk entries"));
    } finally {
      setLoading(false);
    }
  }, []);

  const syncOfflineQueue = useCallback(async () => {
    if (!activeFarm?.id) return;
    const queueKey = `upcheckdairy:${activeFarm.id}:pending_milk_writes`;
    const pendingWrites = await Storage.get<PendingMilkWrite[]>(queueKey) || [];
    if (pendingWrites.length === 0) return;

    console.log(`[MilkProvider] Starting sync for ${pendingWrites.length} offline writes...`);
    const remainingWrites: PendingMilkWrite[] = [];
    const tempIdMap = new Map<string, number>();

    for (const write of pendingWrites) {
      try {
        if (write.type === "create") {
          const response = await apiClient.post<any>("/milk", write.data);
          if (write.tempId) {
            tempIdMap.set(write.tempId, response.id);
          }
        } else if (write.type === "update") {
          let targetId = Number(write.id);
          if (targetId < 0 && write.id && tempIdMap.has(write.id)) {
            targetId = tempIdMap.get(write.id)!;
          }
          if (targetId > 0) {
            await apiClient.put(`/milk/${targetId}`, write.data);
          }
        } else if (write.type === "delete") {
          let targetId = Number(write.id);
          if (targetId < 0 && write.id && tempIdMap.has(write.id)) {
            targetId = tempIdMap.get(write.id)!;
          }
          if (targetId > 0) {
            await apiClient.delete(`/milk/${targetId}`);
          }
        }
      } catch (err) {
        console.error("[MilkProvider] Failed to sync write, retaining in queue:", write, err);
        remainingWrites.push(write);
      }
    }

    await Storage.set(queueKey, remainingWrites);
    const data = await milkRepository.getMilk(activeFarm.id);
    setMilkEntries(data);
  }, [activeFarm?.id]);

  useEffect(() => {
    if (activeFarm?.id) {
      fetchMilk(activeFarm.id);
    } else {
      setMilkEntries([]);
    }
  }, [activeFarm?.id, fetchMilk]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && activeFarm?.id) {
        syncOfflineQueue().catch(err => console.error("[MilkProvider] Offline queue sync error:", err));
      }
    });
    return () => unsubscribe();
  }, [activeFarm?.id, syncOfflineQueue]);

  const createMilk = async (dto: CreateMilkEntryRequestDto) => {
    try {
      const farmId = activeFarm?.id || "";
      const newEntry = await milkRepository.createMilkEntry(dto, farmId);
      setMilkEntries(prev => {
        const exists = prev.some(e => e.id === newEntry.id);
        if (exists) return prev;
        return [newEntry, ...prev];
      });
      return newEntry;
    } catch (e: any) {
      throw e instanceof Error ? e : new Error(e.message || "Failed to create milk entry");
    }
  };

  const updateMilk = async (id: number, dto: UpdateMilkEntryRequestDto) => {
    try {
      const farmId = activeFarm?.id || "";
      const updated = await milkRepository.updateMilkEntry(id, dto, farmId);
      setMilkEntries(prev => prev.map(m => (Number(m.id) === id ? updated : m)));
      return updated;
    } catch (e: any) {
      throw e instanceof Error ? e : new Error(e.message || "Failed to update milk entry");
    }
  };

  const removeMilk = async (id: number) => {
    try {
      const farmId = activeFarm?.id || "";
      await milkRepository.deleteMilkEntry(id, farmId);
      setMilkEntries(prev => prev.filter(m => Number(m.id) !== id));
    } catch (e: any) {
      throw e instanceof Error ? e : new Error(e.message || "Failed to delete milk entry");
    }
  };

  const refresh = async () => {
    if (activeFarm?.id) {
      await fetchMilk(activeFarm.id);
    }
  };

  return (
    <MilkContext.Provider value={{
      loading,
      error,
      milkEntries,
      createMilk,
      updateMilk,
      removeMilk,
      refresh,
    }}>
      {children}
    </MilkContext.Provider>
  );
}

export function useMilkContext() {
  const ctx = useContext(MilkContext);
  if (!ctx) throw new Error("useMilkContext must be used within MilkProvider");
  return ctx;
}
