import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { Animal } from "../models/Animal";
import { animalRepository } from "../api/AnimalRepository";
import { CreateAnimalRequestDto, UpdateAnimalRequestDto } from "../types/AnimalDto";
import { useFarm } from "../../../modules/farms/hooks/useFarm";

interface AnimalContextType {
  loading: boolean;
  error: Error | null;
  animals: Animal[];
  createAnimal: (dto: Omit<CreateAnimalRequestDto, "farmId">) => Promise<Animal>;
  updateAnimal: (id: number, dto: UpdateAnimalRequestDto) => Promise<Animal>;
  removeAnimal: (id: number) => Promise<void>;
  refresh: () => Promise<void>;
}

const AnimalContext = createContext<AnimalContextType | null>(null);

export function AnimalProvider({ children }: { children: React.ReactNode }) {
  const { activeFarm } = useFarm();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  // `loading` and `error` describe the state of loading the list, and nothing
  // else. Mutations below deliberately leave them alone: they reject to their
  // caller, which is the only place that knows how to report the failure.
  // Sharing this state meant one rejected create — a duplicate tag, say — put
  // the whole screen into "Failed to load animals" while the list sat intact
  // in memory, and it stayed there until the next fetch.
  const [error, setError] = useState<Error | null>(null);

  const fetchAnimals = useCallback(async (farmId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await animalRepository.getAnimals(farmId);
      setAnimals(data);
    } catch (e: any) {
      setError(e instanceof Error ? e : new Error(e.message || "Failed to load animals"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeFarm?.id) {
      fetchAnimals(activeFarm.id);
    } else {
      setAnimals([]);
    }
  }, [activeFarm?.id, fetchAnimals]);

  const createAnimal = useCallback(async (dto: Omit<CreateAnimalRequestDto, "farmId">) => {
    if (!activeFarm?.id) {
      throw new Error("No active farm selected");
    }
    try {
      const newAnimal = await animalRepository.createAnimal({
        ...dto,
        farmId: activeFarm.id,
      });
      setAnimals(prev => [...prev, newAnimal]);
      return newAnimal;
    } catch (e: any) {
      throw e instanceof Error ? e : new Error(e.message || "Failed to create animal");
    }
  }, [activeFarm?.id]);

  const updateAnimal = useCallback(async (id: number, dto: UpdateAnimalRequestDto) => {
    try {
      const updated = await animalRepository.updateAnimal(id, dto);
      setAnimals(prev => prev.map(a => (Number(a.id) === id ? updated : a)));
      return updated;
    } catch (e: any) {
      throw e instanceof Error ? e : new Error(e.message || "Failed to update animal");
    }
  }, []);

  const removeAnimal = useCallback(async (id: number) => {
    try {
      await animalRepository.deleteAnimal(id);
      setAnimals(prev => prev.filter(a => Number(a.id) !== id));
    } catch (e: any) {
      throw e instanceof Error ? e : new Error(e.message || "Failed to delete animal");
    }
  }, []);

  const refresh = useCallback(async () => {
    if (activeFarm?.id) {
      await fetchAnimals(activeFarm.id);
    }
  }, [activeFarm?.id, fetchAnimals]);

  const value = useMemo(() => ({
    loading,
    error,
    animals,
    createAnimal,
    updateAnimal,
    removeAnimal,
    refresh,
  }), [loading, error, animals, createAnimal, updateAnimal, removeAnimal, refresh]);

  return (
    <AnimalContext.Provider value={value}>
      {children}
    </AnimalContext.Provider>
  );
}

export function useAnimalContext() {
  const ctx = useContext(AnimalContext);
  if (!ctx) throw new Error("useAnimalContext must be used within AnimalProvider");
  return ctx;
}
