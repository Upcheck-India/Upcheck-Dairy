import { useAnimalContext } from "../context/AnimalProvider";

export function useAnimals() {
  const context = useAnimalContext();
  return {
    loading: context.loading,
    error: context.error,
    animals: context.animals,
    createAnimal: context.createAnimal,
    updateAnimal: context.updateAnimal,
    removeAnimal: context.removeAnimal,
    refresh: context.refresh,
  };
}
