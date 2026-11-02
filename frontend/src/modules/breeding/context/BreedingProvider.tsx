import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { BreedingEvent } from "../models/BreedingEvent";
import { breedingRepository } from "../api/BreedingRepository";
import { CreateBreedingEventRequestDto, UpdateBreedingEventRequestDto } from "../types/BreedingDto";
import { useFarm } from "../../../modules/farms/hooks/useFarm";

interface BreedingContextType {
  loading: boolean;
  error: Error | null;
  breedingEvents: BreedingEvent[];
  createBreeding: (dto: CreateBreedingEventRequestDto) => Promise<BreedingEvent>;
  updateBreeding: (id: number, dto: UpdateBreedingEventRequestDto) => Promise<BreedingEvent>;
  removeBreeding: (id: number) => Promise<void>;
  refresh: () => Promise<void>;
}

const BreedingContext = createContext<BreedingContextType | null>(null);

export function BreedingProvider({ children }: { children: React.ReactNode }) {
  const { activeFarm } = useFarm();
  const [breedingEvents, setBreedingEvents] = useState<BreedingEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchBreeding = useCallback(async (farmId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await breedingRepository.getBreedingEvents(farmId);
      setBreedingEvents(data);
    } catch (e: any) {
      setError(e instanceof Error ? e : new Error(e.message || "Failed to load breeding events"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeFarm?.id) {
      fetchBreeding(activeFarm.id);
    } else {
      setBreedingEvents([]);
    }
  }, [activeFarm?.id, fetchBreeding]);

  const createBreeding = async (dto: CreateBreedingEventRequestDto) => {
    try {
      const newEvent = await breedingRepository.createBreedingEvent(dto);
      setBreedingEvents(prev => [newEvent, ...prev]);
      return newEvent;
    } catch (e: any) {
      throw e instanceof Error ? e : new Error(e.message || "Failed to create breeding event");
    }
  };

  const updateBreeding = async (id: number, dto: UpdateBreedingEventRequestDto) => {
    try {
      const updated = await breedingRepository.updateBreedingEvent(id, dto);
      setBreedingEvents(prev => prev.map(b => (Number(b.id) === id ? updated : b)));
      return updated;
    } catch (e: any) {
      throw e instanceof Error ? e : new Error(e.message || "Failed to update breeding event");
    }
  };

  const removeBreeding = async (id: number) => {
    try {
      await breedingRepository.deleteBreedingEvent(id);
      setBreedingEvents(prev => prev.filter(b => Number(b.id) !== id));
    } catch (e: any) {
      throw e instanceof Error ? e : new Error(e.message || "Failed to delete breeding event");
    }
  };

  const refresh = async () => {
    if (activeFarm?.id) {
      await fetchBreeding(activeFarm.id);
    }
  };

  return (
    <BreedingContext.Provider value={{
      loading,
      error,
      breedingEvents,
      createBreeding,
      updateBreeding,
      removeBreeding,
      refresh,
    }}>
      {children}
    </BreedingContext.Provider>
  );
}

export function useBreedingContext() {
  const ctx = useContext(BreedingContext);
  if (!ctx) throw new Error("useBreedingContext must be used within BreedingProvider");
  return ctx;
}
