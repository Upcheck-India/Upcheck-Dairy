import { useVaccinationContext } from "../context/VaccinationProvider";

export function useVaccination() {
  const context = useVaccinationContext();
  return {
    loading: context.loading,
    error: context.error,
    vaccinations: context.vaccinations,
    createVaccination: context.createVaccination,
    updateVaccination: context.updateVaccination,
    removeVaccination: context.removeVaccination,
    markDone: context.markDone,
    refresh: context.refresh,
  };
}
