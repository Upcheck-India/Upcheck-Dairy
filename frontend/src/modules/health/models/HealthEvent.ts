export class HealthEvent {
  readonly id: string;
  readonly animalId: string;
  readonly date: Date;
  readonly type: "vaccination" | "treatment" | "observation" | "diagnosis";
  readonly description: string;
  readonly veterinarianName: string | null;
  readonly cost: number | null;
  readonly followUpDate: Date | null;
  readonly createdAt: Date | null;

  constructor(data: {
    id: string;
    animalId: string;
    date: Date;
    type: "vaccination" | "treatment" | "observation" | "diagnosis";
    description: string;
    veterinarianName?: string | null;
    cost?: number | null;
    followUpDate?: Date | null;
    createdAt?: Date | null;
  }) {
    this.id = data.id;
    this.animalId = data.animalId;
    this.date = data.date;
    this.type = data.type;
    this.description = data.description;
    this.veterinarianName = data.veterinarianName ?? null;
    this.cost = data.cost ?? null;
    this.followUpDate = data.followUpDate ?? null;
    this.createdAt = data.createdAt ?? null;
  }

  get formattedCost(): string | null {
    return this.cost !== null ? `₹${this.cost.toFixed(2)}` : null;
  }

  get statusColor(): string {
    switch (this.type) {
      case "vaccination":
        return "#3b82f6"; // blue
      case "treatment":
        return "#ef4444"; // red
      case "observation":
        return "#f59e0b"; // amber
      case "diagnosis":
        return "#10b981"; // emerald
      default:
        return "#6b7280"; // gray
    }
  }

  get typeLabel(): string {
    return this.type.charAt(0).toUpperCase() + this.type.slice(1);
  }
}
