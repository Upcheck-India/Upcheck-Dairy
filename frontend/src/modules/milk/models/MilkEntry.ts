export class MilkEntry {
  readonly id: string;
  readonly animalId: string;
  readonly session: "morning" | "evening";
  readonly quantity: number;
  readonly date: Date;
  readonly fat: number | null;
  readonly snf: number | null;
  readonly notes: string | null;
  readonly createdAt: Date | null;

  constructor(data: {
    id: string;
    animalId: string;
    session: "morning" | "evening";
    quantity: number;
    date: Date;
    fat?: number | null;
    snf?: number | null;
    notes?: string | null;
    createdAt?: Date | null;
  }) {
    this.id = data.id;
    this.animalId = data.animalId;
    this.session = data.session;
    this.quantity = data.quantity;
    this.date = data.date;
    this.fat = data.fat ?? null;
    this.snf = data.snf ?? null;
    this.notes = data.notes ?? null;
    this.createdAt = data.createdAt ?? null;
  }

  get isMorningSession(): boolean {
    return this.session === "morning";
  }

  get isEveningSession(): boolean {
    return this.session === "evening";
  }

  get formattedQuantity(): string {
    return `${this.quantity.toFixed(1)}L`;
  }

  get fatPercent(): string | null {
    return this.fat !== null ? `${this.fat.toFixed(1)}%` : null;
  }

  get snfPercent(): string | null {
    return this.snf !== null ? `${this.snf.toFixed(1)}%` : null;
  }
}
