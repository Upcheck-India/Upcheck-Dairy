import { getISTDateString } from "../../../../utils/date";

export class Task {
  readonly id: string;
  readonly farmId: string;
  readonly animalId: string | null;
  readonly title: string;
  readonly time: string;
  readonly session: string;
  readonly completed: boolean;
  readonly date: Date;
  readonly type: "milk" | "feed" | "health" | "clean" | "other" | "breeding" | "vaccination";
  readonly priority: "low" | "normal" | "high" | "critical";
  readonly createdAt: Date | null;

  constructor(data: {
    id: string;
    farmId: string;
    animalId?: string | null;
    title: string;
    time: string;
    session: string;
    completed: boolean;
    date: Date;
    type: "milk" | "feed" | "health" | "clean" | "other" | "breeding" | "vaccination";
    priority?: "low" | "normal" | "high" | "critical";
    createdAt?: Date | null;
  }) {
    this.id = data.id;
    this.farmId = data.farmId;
    this.animalId = data.animalId ?? null;
    this.title = data.title;
    this.time = data.time;
    this.session = data.session;
    this.completed = data.completed;
    this.date = data.date;
    this.type = data.type;
    this.priority = data.priority ?? "normal";
    this.createdAt = data.createdAt ?? null;
  }

  get isHighPriority(): boolean {
    return this.priority === "high" || this.priority === "critical";
  }

  get formattedDateString(): string {
    return getISTDateString(this.date);
  }
}
