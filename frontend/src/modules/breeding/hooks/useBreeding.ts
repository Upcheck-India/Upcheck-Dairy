import { useBreedingContext } from "../context/BreedingProvider";

export function useBreeding() {
  const context = useBreedingContext();
  return {
    loading: context.loading,
    error: context.error,
    breedingEvents: context.breedingEvents,
    createBreeding: context.createBreeding,
    updateBreeding: context.updateBreeding,
    removeBreeding: context.removeBreeding,
    refresh: context.refresh,
  };
}
