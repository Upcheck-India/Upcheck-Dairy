import { UpdateAnimalRequestDto } from "../../animals/types/AnimalDto";

export type BreedingEventTypeValue =
  | "heat"
  | "insemination"
  | "pregnancy_confirmed"
  | "dry_off"
  | "calving"
  | "abort";

/**
 * Categories the app seeds every farm with. A farmer's own category must never
 * be overwritten by an automatic transition, so `status` is only ever changed
 * when the animal still sits in one of these. Mirrors the same guard the API
 * applies in animals.service.ts.
 */
export const SEEDED_STATUSES = ["lactating", "pregnant", "dry", "calf", "other"] as const;

export interface BreedingAnimalState {
  status?: string | null;
  isPregnant: boolean;
  lactationNumber?: number | null;
}

/**
 * The animal-level changes a breeding event implies.
 *
 * Recording the event alone leaves the animal's own fields stale — a cow whose
 * pregnancy was just confirmed still reads "not pregnant" everywhere else in
 * the app. Returns null when an event implies no change, so callers can skip
 * the write entirely.
 */
export function animalUpdateForBreedingEvent(
  animal: BreedingAnimalState,
  eventType: BreedingEventTypeValue,
  eventDateIso: string,
  expectedCalvingDateIso?: string
): UpdateAnimalRequestDto | null {
  const inSeededCategory =
    !animal.status || (SEEDED_STATUSES as readonly string[]).includes(animal.status);

  // Only proposes a status when the animal is still in a seeded category.
  const withStatus = (
    update: UpdateAnimalRequestDto,
    status: string
  ): UpdateAnimalRequestDto => (inSeededCategory ? { ...update, status } : update);

  switch (eventType) {
    // An animal observed in heat is cycling, so she is not carrying a calf.
    case "heat":
      return animal.isPregnant
        ? { isPregnant: false, expectedCalvingDate: null }
        : null;

    // Served but not yet confirmed — record the due-date estimate without
    // claiming she is pregnant.
    case "insemination":
      return expectedCalvingDateIso
        ? { expectedCalvingDate: expectedCalvingDateIso }
        : null;

    case "pregnancy_confirmed":
      return withStatus(
        {
          isPregnant: true,
          ...(expectedCalvingDateIso ? { expectedCalvingDate: expectedCalvingDateIso } : {}),
        },
        "pregnant"
      );

    // Stopped milking ahead of calving. Pregnancy is deliberately left alone —
    // being dried off says nothing about whether she is still carrying.
    case "dry_off":
      return inSeededCategory ? { status: "dry" } : null;

    // She has calved: no longer pregnant, back in milk, and a lactation done.
    case "calving":
      return withStatus(
        {
          isPregnant: false,
          expectedCalvingDate: null,
          lastCalvingDate: eventDateIso,
          lactationNumber: (animal.lactationNumber ?? 0) + 1,
        },
        "lactating"
      );

    // Pregnancy ended without a calf. She is open again; her milking status is
    // left for the farmer to set, since it depends on how far along she was.
    case "abort":
      return {
        isPregnant: false,
        expectedCalvingDate: null,
        ...(inSeededCategory && animal.status === "pregnant" ? { status: "other" } : {}),
      };

    default:
      return null;
  }
}
