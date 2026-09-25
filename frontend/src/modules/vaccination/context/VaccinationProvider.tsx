import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Vaccination } from "../models/Vaccination";
import { vaccinationRepository } from "../api/VaccinationRepository";
import { CreateVaccinationRequestDto, UpdateVaccinationRequestDto } from "../types/VaccinationDto";
import { useFarm } from "../../../modules/farms/hooks/useFarm";

interface VaccinationContextType {
  loading: boolean;
  error: Error | null;
  vaccinations: Vaccination[];
  createVaccination: (dto: CreateVaccinationRequestDto) => Promise<Vaccination>;
  updateVaccination: (id: number, dto: UpdateVaccinationRequestDto) => Promise<Vaccination>;
  removeVaccination: (id: number) => Promise<void>;
  markDone: (id: number, dateStr: string) => Promise<Vaccination>;
  refresh: () => Promise<void>;
}

const VaccinationContext = createContext<VaccinationContextType | null>(null);

export function VaccinationProvider({ children }: { children: React.ReactNode }) {
  const { activeFarm } = useFarm();
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchVaccinations = useCallback(async (farmId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await vaccinationRepository.getVaccinations(farmId);
      setVaccinations(data);
    } catch (e: any) {
      setError(e instanceof Error ? e : new Error(e.message || "Failed to load vaccinations"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeFarm?.id) {
      fetchVaccinations(activeFarm.id);
    } else {
      setVaccinations([]);
    }
  }, [activeFarm?.id, fetchVaccinations]);

  const createVaccination = async (dto: CreateVaccinationRequestDto) => {
    try {
      const newVax = await vaccinationRepository.createVaccination(dto);
      setVaccinations(prev => [newVax, ...prev]);
      return newVax;
    } catch (e: any) {
      throw e instanceof Error ? e : new Error(e.message || "Failed to create vaccination");
    }
  };

  const updateVaccination = async (id: number, dto: UpdateVaccinationRequestDto) => {
    try {
      const updated = await vaccinationRepository.updateVaccination(id, dto);
      setVaccinations(prev => prev.map(v => (Number(v.id) === id ? updated : v)));
      return updated;
    } catch (e: any) {
      throw e instanceof Error ? e : new Error(e.message || "Failed to update vaccination");
    }
  };

  const removeVaccination = async (id: number) => {
    try {
      await vaccinationRepository.deleteVaccination(id);
      setVaccinations(prev => prev.filter(v => Number(v.id) !== id));
    } catch (e: any) {
      throw e instanceof Error ? e : new Error(e.message || "Failed to delete vaccination");
    }
  };

  const markDone = async (id: number, dateStr: string) => {
    return updateVaccination(id, { administeredDate: dateStr });
  };

  const refresh = async () => {
    if (activeFarm?.id) {
      await fetchVaccinations(activeFarm.id);
    }
  };

  return (
    <VaccinationContext.Provider value={{
      loading,
      error,
      vaccinations,
      createVaccination,
      updateVaccination,
      removeVaccination,
      markDone,
      refresh,
    }}>
      {children}
    </VaccinationContext.Provider>
  );
}

export function useVaccinationContext() {
  const ctx = useContext(VaccinationContext);
  if (!ctx) throw new Error("useVaccinationContext must be used within VaccinationProvider");
  return ctx;
}
