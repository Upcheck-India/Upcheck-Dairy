import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
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

  const createAnimal = async (dto: Omit<CreateAnimalRequestDto, "farmId">) => {
    if (!activeFarm?.id) {
      throw new Error("No active farm selected");
    }
    setError(null);
    setLoading(true);
    try {
      const newAnimal = await animalRepository.createAnimal({
        ...dto,
        farmId: activeFarm.id,
      });
      setAnimals(prev => [...prev, newAnimal]);
      return newAnimal;
    } catch (e: any) {
      const err = e instanceof Error ? e : new Error(e.message || "Failed to create animal");
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateAnimal = async (id: number, dto: UpdateAnimalRequestDto) => {
    setError(null);
    setLoading(true);
    try {
      const updated = await animalRepository.updateAnimal(id, dto);
      setAnimals(prev => prev.map(a => (Number(a.id) === id ? updated : a)));
      return updated;
    } catch (e: any) {
      const err = e instanceof Error ? e : new Error(e.message || "Failed to update animal");
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeAnimal = async (id: number) => {
    setError(null);
    setLoading(true);
    try {
      await animalRepository.deleteAnimal(id);
      setAnimals(prev => prev.filter(a => Number(a.id) !== id));
    } catch (e: any) {
      const err = e instanceof Error ? e : new Error(e.message || "Failed to delete animal");
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    if (activeFarm?.id) {
      await fetchAnimals(activeFarm.id);
    }
  };

  return (
    <AnimalContext.Provider value={{
      loading,
      error,
      animals,
      createAnimal,
      updateAnimal,
      removeAnimal,
      refresh,
    }}>
      {children}
    </AnimalContext.Provider>
  );
}

export function useAnimalContext() {
  const ctx = useContext(AnimalContext);
  if (!ctx) throw new Error("useAnimalContext must be used within AnimalProvider");
  return ctx;
}
