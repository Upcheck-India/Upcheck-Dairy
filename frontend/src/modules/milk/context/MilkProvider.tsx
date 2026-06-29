import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { MilkEntry } from "../models/MilkEntry";
import { milkRepository } from "../api/MilkRepository";
import { CreateMilkEntryRequestDto, UpdateMilkEntryRequestDto } from "../types/MilkDto";
import { useFarm } from "../../../modules/farms/hooks/useFarm";

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

  useEffect(() => {
    if (activeFarm?.id) {
      fetchMilk(activeFarm.id);
    } else {
      setMilkEntries([]);
    }
  }, [activeFarm?.id, fetchMilk]);

  const createMilk = async (dto: CreateMilkEntryRequestDto) => {
    setError(null);
    setLoading(true);
    try {
      const newEntry = await milkRepository.createMilkEntry(dto);
      setMilkEntries(prev => [newEntry, ...prev]);
      return newEntry;
    } catch (e: any) {
      const err = e instanceof Error ? e : new Error(e.message || "Failed to create milk entry");
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateMilk = async (id: number, dto: UpdateMilkEntryRequestDto) => {
    setError(null);
    setLoading(true);
    try {
      const updated = await milkRepository.updateMilkEntry(id, dto);
      setMilkEntries(prev => prev.map(m => (Number(m.id) === id ? updated : m)));
      return updated;
    } catch (e: any) {
      const err = e instanceof Error ? e : new Error(e.message || "Failed to update milk entry");
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeMilk = async (id: number) => {
    setError(null);
    setLoading(true);
    try {
      await milkRepository.deleteMilkEntry(id);
      setMilkEntries(prev => prev.filter(m => Number(m.id) !== id));
    } catch (e: any) {
      const err = e instanceof Error ? e : new Error(e.message || "Failed to delete milk entry");
      setError(err);
      throw err;
    } finally {
      setLoading(false);
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
