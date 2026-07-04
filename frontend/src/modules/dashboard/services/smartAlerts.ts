import { Animal } from "../../animals/models/Animal";
import { BreedingEvent } from "../../breeding/models/BreedingEvent";
import { Vaccination } from "../../vaccination/models/Vaccination";
import { getISTDateString } from "../../../../utils/date";

export interface SmartAlert {
  id: string;
  type: "heat" | "calving" | "vaccine" | "dry_off";
  animalId: string;
  animalName: string;
  message: string;
  messageTamil: string;
  daysAway: number;
  priority: "normal" | "high" | "critical";
}

function daysBetween(fromDateStr: string, toDateStr: string): number {
  const a = new Date(fromDateStr).getTime();
  const b = new Date(toDateStr).getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

export function computeSmartAlerts(
  animals: Animal[],
  breedingEvents: BreedingEvent[],
  vaccinations: Vaccination[]
): SmartAlert[] {
  const alerts: SmartAlert[] = [];
  const today = getISTDateString();

  for (const animal of animals) {
    if (animal.type === "calf") continue;
    if (animal.isPregnant) continue;

    const animalBreeding = breedingEvents
      .filter((e) => e.animalId === animal.id)
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    const lastHeat = animalBreeding.find((e) => e.eventType === "heat");
    if (lastHeat) {
      const daysSinceHeat = daysBetween(getISTDateString(lastHeat.date), today);
      if (daysSinceHeat >= 18 && daysSinceHeat <= 24) {
        alerts.push({
          id: `heat-${animal.id}`,
          type: "heat",
          animalId: animal.id,
          animalName: animal.name,
          message: `${animal.name} may be in heat (${daysSinceHeat} days since last heat)`,
          messageTamil: `${animal.name} இன்று ஈட்டில் இருக்கலாம் (கடந்த ஈட்டிலிருந்து ${daysSinceHeat} நாட்கள்)`,
          daysAway: 0,
          priority: "high",
        });
      }
    }

    // Calving alert
    if (animal.expectedCalvingDate) {
      const daysToCalving = daysBetween(today, getISTDateString(animal.expectedCalvingDate));
      if (daysToCalving >= 0 && daysToCalving <= 21) {
        alerts.push({
          id: `calving-${animal.id}`,
          type: "calving",
          animalId: animal.id,
          animalName: animal.name,
          message: `${animal.name} due to calve in ${daysToCalving} day${daysToCalving !== 1 ? "s" : ""}`,
          messageTamil: `${animal.name} ${daysToCalving === 0 ? "இன்று" : `${daysToCalving} நாட்களில்`} குட்டி போடும்`,
          daysAway: daysToCalving,
          priority: daysToCalving <= 3 ? "critical" : "high",
        });
      }
    }
  }

  // Vaccine due alerts
  for (const vax of vaccinations) {
    if (vax.administeredDate !== null) continue;
    const daysUntil = daysBetween(today, getISTDateString(vax.scheduledDate));
    if (daysUntil >= -7 && daysUntil <= 14) {
      const animal = animals.find((a) => a.id === vax.animalId);
      if (!animal) continue;
      const overdue = daysUntil < 0;
      alerts.push({
        id: `vax-${vax.id}`,
        type: "vaccine",
        animalId: animal.id,
        animalName: animal.name,
        message: overdue
          ? `${animal.name}: ${vax.vaccineName} vaccine overdue by ${-daysUntil} days`
          : `${animal.name}: ${vax.vaccineName} vaccine due in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}`,
        messageTamil: overdue
          ? `${animal.name}: ${vax.vaccineName} தடுப்பூசி ${-daysUntil} நாட்கள் கடந்தது`
          : `${animal.name}: ${vax.vaccineName} தடுப்பூசி ${daysUntil} நாட்களில்`,
        daysAway: daysUntil,
        priority: overdue ? "critical" : daysUntil <= 3 ? "high" : "normal",
      });
    }
  }

  return alerts.sort((a, b) => a.daysAway - b.daysAway);
}
