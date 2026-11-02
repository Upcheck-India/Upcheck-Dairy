import { Animal } from "../../animals/models/Animal";
import { Shed } from "../context/ShedProvider";

const CALF_SHED_PATTERN = /calf|கன்று|बछड़/i;

function isCalfShed(shed: Shed) {
  return shed.id === "shed_4" || CALF_SHED_PATTERN.test(shed.name);
}

/**
 * The shed a newly added animal should default to. Picks the calf shed for
 * calves when one exists, otherwise the first shed the farm has.
 */
export function defaultShedIdFor(
  animalType: "cow" | "buffalo" | "calf",
  sheds: Shed[]
): string {
  if (!sheds.length) return "";
  if (animalType === "calf") {
    const calfShed = sheds.find(isCalfShed);
    if (calfShed) return calfShed.id;
  }
  return sheds.find((s) => !isCalfShed(s))?.id ?? sheds[0].id;
}

/**
 * Resolve the shed an animal belongs to, constrained to the sheds that actually
 * exist right now.
 *
 * Animals without an explicit assignment — and animals still pointing at a shed
 * the farmer has deleted — are spread deterministically across the remaining
 * sheds. Deriving the fallback from the live shed list (instead of hardcoded
 * `shed_1..shed_4` ids) is what keeps a deleted shed from reappearing on the
 * Herd page.
 */
export function resolveAnimalShed(animal: Animal, sheds: Shed[]): string {
  if (!sheds.length) return animal.shed ?? "";
  if (animal.shed && sheds.some((s) => s.id === animal.shed)) return animal.shed;

  if (animal.type === "calf" || animal.status === "calf") {
    const calfShed = sheds.find(isCalfShed);
    if (calfShed) return calfShed.id;
  }

  // Keep calves' shed out of the adult rotation when there is somewhere else to go.
  const candidates = sheds.filter((s) => !isCalfShed(s));
  const pool = candidates.length > 0 ? candidates : sheds;
  const idNum = parseInt(animal.id, 10) || 0;
  return pool[idNum % pool.length].id;
}
