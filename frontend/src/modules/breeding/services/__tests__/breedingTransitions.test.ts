import { animalUpdateForBreedingEvent } from "../breedingTransitions";

const DATE = "2026-09-25T00:00:00.000Z";
const DUE = "2027-07-05T00:00:00.000Z";

const open = { status: "lactating", isPregnant: false, lactationNumber: 2 };
const carrying = { status: "pregnant", isPregnant: true, lactationNumber: 2 };

describe("animalUpdateForBreedingEvent", () => {
  it("confirms pregnancy and records the due date", () => {
    const update = animalUpdateForBreedingEvent(open, "pregnancy_confirmed", DATE, DUE);
    expect(update).toEqual({
      isPregnant: true,
      expectedCalvingDate: DUE,
      status: "pregnant",
    });
  });

  it("records a due-date estimate on insemination without claiming pregnancy", () => {
    const update = animalUpdateForBreedingEvent(open, "insemination", DATE, DUE);
    expect(update).toEqual({ expectedCalvingDate: DUE });
    expect(update).not.toHaveProperty("isPregnant");
  });

  it("closes out the pregnancy on calving and advances the lactation", () => {
    const update = animalUpdateForBreedingEvent(carrying, "calving", DATE, undefined);
    expect(update).toEqual({
      isPregnant: false,
      expectedCalvingDate: null,
      lastCalvingDate: DATE,
      lactationNumber: 3,
      status: "lactating",
    });
  });

  it("starts lactation counting at one for a first calving", () => {
    const heifer = { status: "other", isPregnant: true, lactationNumber: null };
    const update = animalUpdateForBreedingEvent(heifer, "calving", DATE, undefined);
    expect(update?.lactationNumber).toBe(1);
  });

  it("marks an animal dry without touching her pregnancy", () => {
    const update = animalUpdateForBreedingEvent(carrying, "dry_off", DATE, undefined);
    expect(update).toEqual({ status: "dry" });
  });

  it("clears pregnancy when an animal is seen in heat", () => {
    const update = animalUpdateForBreedingEvent(carrying, "heat", DATE, undefined);
    expect(update).toEqual({ isPregnant: false, expectedCalvingDate: null });
  });

  it("does nothing when an open animal is seen in heat", () => {
    expect(animalUpdateForBreedingEvent(open, "heat", DATE, undefined)).toBeNull();
  });

  it("ends the pregnancy on an abort", () => {
    const update = animalUpdateForBreedingEvent(carrying, "abort", DATE, undefined);
    expect(update).toEqual({
      isPregnant: false,
      expectedCalvingDate: null,
      status: "other",
    });
  });

  it("never overwrites a farmer's own category", () => {
    const custom = { status: "show-herd", isPregnant: false, lactationNumber: 1 };

    expect(animalUpdateForBreedingEvent(custom, "pregnancy_confirmed", DATE, DUE)).toEqual({
      isPregnant: true,
      expectedCalvingDate: DUE,
    });
    expect(animalUpdateForBreedingEvent(custom, "dry_off", DATE, undefined)).toBeNull();
    expect(
      animalUpdateForBreedingEvent(custom, "calving", DATE, undefined)
    ).not.toHaveProperty("status");
  });
});
