export class Vaccination {
  readonly id: string;
  readonly animalId: string;
  readonly vaccineName: string;
  readonly vaccineType: "FMD" | "HS" | "BQ" | "Brucellosis" | "Theileriosis" | "Anthrax" | "PPR" | "Other";
  readonly scheduledDate: Date;
  readonly administeredDate: Date | null;
  readonly batchNo: string | null;
  readonly administeredBy: string | null;
  readonly cost: number | null;
  readonly nextDueDate: Date | null;
  readonly note: string | null;
  readonly createdAt: Date | null;

  constructor(data: {
    id: string;
    animalId: string;
    vaccineName: string;
    vaccineType: "FMD" | "HS" | "BQ" | "Brucellosis" | "Theileriosis" | "Anthrax" | "PPR" | "Other";
    scheduledDate: Date;
    administeredDate?: Date | null;
    batchNo?: string | null;
    administeredBy?: string | null;
    cost?: number | null;
    nextDueDate?: Date | null;
    note?: string | null;
    createdAt?: Date | null;
  }) {
    this.id = data.id;
    this.animalId = data.animalId;
    this.vaccineName = data.vaccineName;
    this.vaccineType = data.vaccineType;
    this.scheduledDate = data.scheduledDate;
    this.administeredDate = data.administeredDate ?? null;
    this.batchNo = data.batchNo ?? null;
    this.administeredBy = data.administeredBy ?? null;
    this.cost = data.cost ?? null;
    this.nextDueDate = data.nextDueDate ?? null;
    this.note = data.note ?? null;
    this.createdAt = data.createdAt ?? null;
  }

  get isOverdue(): boolean {
    if (this.administeredDate) return false;
    return this.scheduledDate.getTime() < Date.now();
  }

  get formattedCost(): string | null {
    return this.cost !== null ? `₹${this.cost.toFixed(2)}` : null;
  }

  get daysRemaining(): number {
    return Math.floor((this.scheduledDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }
}
