import { Animal } from "../../animals/models/Animal";
import { MilkEntry } from "../models/MilkEntry";
import { getISTDateString } from "../../../../utils/date";

export interface MilkAnomaly {
  animalId: string;
  animalName: string;
  dropPercent: number;
  todayTotal: number;
  avgTotal: number;
  severity: "attention" | "critical";
}

function getTodayDateStr(): string {
  return getISTDateString();
}

function getPastDateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return getISTDateString(d);
}

export function detectMilkAnomalies(animals: Animal[], milkEntries: MilkEntry[]): MilkAnomaly[] {
  const today = getTodayDateStr();
  const anomalies: MilkAnomaly[] = [];

  for (const animal of animals) {
    if (animal.type === "calf") continue;

    const animalMilk = milkEntries.filter(
      (e: MilkEntry) => e.animalId === animal.id
    );

    const todayMilk = animalMilk
      .filter((e: MilkEntry) => getISTDateString(e.date) === today)
      .reduce((s: number, e: MilkEntry) => s + e.quantity, 0);

    if (todayMilk === 0) continue;

    const prev3Totals = [1, 2, 3]
      .map((i: number) => {
        const d = getPastDateStr(i);
        return animalMilk
          .filter((e: MilkEntry) => getISTDateString(e.date) === d)
          .reduce((s: number, e: MilkEntry) => s + e.quantity, 0);
      })
      .filter((v: number) => v > 0);

    if (prev3Totals.length === 0) continue;
    const avg = prev3Totals.reduce((s: number, v: number) => s + v, 0) / prev3Totals.length;
    if (avg === 0) continue;

    const dropPercent = ((avg - todayMilk) / avg) * 100;
    if (dropPercent >= 15) {
      anomalies.push({
        animalId: animal.id,
        animalName: animal.name,
        dropPercent: Math.round(dropPercent),
        todayTotal: todayMilk,
        avgTotal: Math.round(avg * 10) / 10,
        severity: dropPercent >= 30 ? "critical" : "attention",
      });
    }
  }

  return anomalies;
}
