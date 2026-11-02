export class BreedingEvent {
  readonly id: string;
  readonly animalId: string;
  readonly eventType: "heat" | "insemination" | "pregnancy_confirmed" | "dry_off" | "calving" | "abort";
  readonly date: Date;
  readonly note: string | null;
  /** Sire kept on this farm; null for AI or an outside bull named in bullName. */
  readonly sireId: string | null;
  readonly bullName: string | null;
  readonly expectedCalvingDate: Date | null;
  readonly calvingGender: string | null;
  readonly createdAt: Date | null;

  constructor(data: {
    id: string;
    animalId: string;
    eventType: "heat" | "insemination" | "pregnancy_confirmed" | "dry_off" | "calving" | "abort";
    date: Date;
    note?: string | null;
    sireId?: string | null;
    bullName?: string | null;
    expectedCalvingDate?: Date | null;
    calvingGender?: string | null;
    createdAt?: Date | null;
  }) {
    this.id = data.id;
    this.animalId = data.animalId;
    this.eventType = data.eventType;
    this.date = data.date;
    this.note = data.note ?? null;
    this.sireId = data.sireId ?? null;
    this.bullName = data.bullName ?? null;
    this.expectedCalvingDate = data.expectedCalvingDate ?? null;
    this.calvingGender = data.calvingGender ?? null;
    this.createdAt = data.createdAt ?? null;
  }

  get typeLabel(): string {
    if (this.eventType === "pregnancy_confirmed") return "Pregnancy Confirmed";
    if (this.eventType === "dry_off") return "Dry Off";
    return this.eventType.charAt(0).toUpperCase() + this.eventType.slice(1);
  }

  get statusColor(): string {
    switch (this.eventType) {
      case "heat":
        return "#f43f5e"; // rose
      case "insemination":
        return "#3b82f6"; // blue
      case "pregnancy_confirmed":
        return "#10b981"; // emerald
      case "dry_off":
        return "#8b5cf6"; // purple
      case "calving":
        return "#06b6d4"; // cyan
      case "abort":
        return "#ef4444"; // red
      default:
        return "#6b7280"; // gray
    }
  }

  get formattedExpectedCalvingDate(): string | null {
    return this.expectedCalvingDate ? this.expectedCalvingDate.toLocaleDateString() : null;
  }
}
