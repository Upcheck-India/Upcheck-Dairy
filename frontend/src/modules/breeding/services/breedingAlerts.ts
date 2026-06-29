import { Animal } from "../../animals/models/Animal";
import { BreedingEvent } from "../models/BreedingEvent";

export function computeBreedingAlertsCount(animals: Animal[], breedingEvents: BreedingEvent[]): number {
  return animals.filter((a: Animal) => {
    if (a.type === "calf" || a.isPregnant) return false;
    const lastHeat = breedingEvents
      .filter((e: BreedingEvent) => e.animalId === a.id && e.eventType === "heat")
      .sort((x: BreedingEvent, y: BreedingEvent) => y.date.getTime() - x.date.getTime())[0];
    if (!lastHeat) return false;
    const days = Math.floor(
      (Date.now() - lastHeat.date.getTime()) / 86400000
    );
    return days >= 18 && days <= 24;
  }).length;
}
