import { Animal } from "../../../animals/models/Animal";
import { Shed } from "../../context/ShedProvider";
import { defaultShedIdFor, resolveAnimalShed } from "../shedAssignment";

const SHEDS: Shed[] = [
  { id: "shed_1", name: "Shed 1 - Main Shed" },
  { id: "shed_2", name: "Shed 2 - North Shed" },
  { id: "shed_4", name: "Shed 4 - Calf Pen" },
];

function makeAnimal(overrides: Partial<ConstructorParameters<typeof Animal>[0]> = {}) {
  return new Animal({
    id: "1",
    farmId: "farm_1",
    name: "Lakshmi",
    type: "cow",
    breed: "Jersey",
    healthStatus: "healthy",
    isPregnant: false,
    ...overrides,
  });
}

describe("resolveAnimalShed", () => {
  it("keeps an explicit assignment when that shed still exists", () => {
    expect(resolveAnimalShed(makeAnimal({ shed: "shed_2" }), SHEDS)).toBe("shed_2");
  });

  it("never returns a shed that was deleted", () => {
    const remaining = SHEDS.filter((s) => s.id !== "shed_2");
    const resolved = resolveAnimalShed(makeAnimal({ shed: "shed_2" }), remaining);
    expect(remaining.map((s) => s.id)).toContain(resolved);
  });

  it("puts unassigned calves in the calf shed", () => {
    expect(resolveAnimalShed(makeAnimal({ type: "calf" }), SHEDS)).toBe("shed_4");
  });

  it("keeps unassigned adults out of the calf shed", () => {
    const ids = ["1", "2", "3", "4", "5"].map((id) =>
      resolveAnimalShed(makeAnimal({ id }), SHEDS)
    );
    expect(ids).not.toContain("shed_4");
  });

  it("is deterministic for the same animal and shed list", () => {
    const animal = makeAnimal({ id: "7" });
    expect(resolveAnimalShed(animal, SHEDS)).toBe(resolveAnimalShed(animal, SHEDS));
  });
});

describe("defaultShedIdFor", () => {
  it("defaults calves to the calf shed", () => {
    expect(defaultShedIdFor("calf", SHEDS)).toBe("shed_4");
  });

  it("defaults adults to the first non-calf shed", () => {
    expect(defaultShedIdFor("cow", SHEDS)).toBe("shed_1");
  });

  it("falls back to the only shed left when it is the calf shed", () => {
    expect(defaultShedIdFor("cow", [SHEDS[2]])).toBe("shed_4");
  });

  it("returns an empty id when the farm has no sheds", () => {
    expect(defaultShedIdFor("cow", [])).toBe("");
  });
});
