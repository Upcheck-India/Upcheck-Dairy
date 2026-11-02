import { AnimalStatus } from "../types/AnimalDto";

export class Animal {
  readonly id: string;
  readonly farmId: string;
  readonly name: string;
  readonly type: "cow" | "buffalo" | "calf";
  readonly breed: string;
  readonly tagNumber: string | null;
  readonly photoUri: string | null;
  readonly healthStatus: "healthy" | "attention" | "critical";
  readonly notes: string | null;
  readonly birthDate: Date | null;
  readonly nextVaccinationDate: Date | null;
  readonly nextDeliveryDate: Date | null;
  readonly lactationNumber: number | null;
  readonly lastCalvingDate: Date | null;
  readonly expectedCalvingDate: Date | null;
  readonly isPregnant: boolean;
  readonly bodyConditionScore: number | null;
  readonly weightKg: number | null;
  readonly shed: string | null;
  readonly status: AnimalStatus | null;
  readonly gender: string | null;
  readonly createdAt: Date | null;
  readonly updatedAt: Date | null;
  readonly lastMilkEntry: { quantity: number; session: "morning" | "evening" } | null;

  constructor(data: {
    id: string;
    farmId: string;
    name: string;
    type: "cow" | "buffalo" | "calf";
    breed: string;
    tagNumber?: string | null;
    photoUri?: string | null;
    healthStatus: "healthy" | "attention" | "critical";
    notes?: string | null;
    birthDate?: Date | null;
    nextVaccinationDate?: Date | null;
    nextDeliveryDate?: Date | null;
    lactationNumber?: number | null;
    lastCalvingDate?: Date | null;
    expectedCalvingDate?: Date | null;
    isPregnant: boolean;
    bodyConditionScore?: number | null;
    weightKg?: number | null;
    shed?: string | null;
    status?: AnimalStatus | null;
    gender?: string | null;
    createdAt?: Date | null;
    updatedAt?: Date | null;
    lastMilkEntry?: { quantity: number; session: "morning" | "evening" } | null;
  }) {
    this.id = data.id;
    this.farmId = data.farmId;
    this.name = data.name;
    this.type = data.type;
    this.breed = data.breed;
    this.tagNumber = data.tagNumber ?? null;
    this.photoUri = data.photoUri ?? null;
    this.healthStatus = data.healthStatus;
    this.notes = data.notes ?? null;
    this.birthDate = data.birthDate ?? null;
    this.nextVaccinationDate = data.nextVaccinationDate ?? null;
    this.nextDeliveryDate = data.nextDeliveryDate ?? null;
    this.lactationNumber = data.lactationNumber ?? null;
    this.lastCalvingDate = data.lastCalvingDate ?? null;
    this.expectedCalvingDate = data.expectedCalvingDate ?? null;
    this.isPregnant = data.isPregnant;
    this.bodyConditionScore = data.bodyConditionScore ?? null;
    this.weightKg = data.weightKg ?? null;
    this.shed = data.shed ?? null;
    this.status = data.status ?? null;
    this.gender = data.gender ?? null;
    this.createdAt = data.createdAt ?? null;
    this.updatedAt = data.updatedAt ?? null;
    this.lastMilkEntry = data.lastMilkEntry ?? null;
  }

  get ageMonths(): number {
    if (!this.birthDate) return 0;
    const today = new Date();
    return (
      (today.getFullYear() - this.birthDate.getFullYear()) * 12 +
      today.getMonth() -
      this.birthDate.getMonth()
    );
  }

  get ageYears(): number {
    return Math.floor(this.ageMonths / 12);
  }

  get isCalf(): boolean {
    return this.type === "calf";
  }

  get isAdult(): boolean {
    return this.type !== "calf";
  }

  get isHeifer(): boolean {
    return this.type === "cow" && !this.isPregnant && (!this.lactationNumber || this.lactationNumber === 0);
  }

  get displayName(): string {
    return this.name;
  }

  get statusColor(): string {
    if (this.healthStatus === "healthy") return "#16a34a"; // green
    if (this.healthStatus === "attention") return "#ea580c"; // orange
    return "#dc2626"; // red
  }

  get subtitle(): string {
    const typeLabel = this.type.charAt(0).toUpperCase() + this.type.slice(1);
    return `${this.breed} ${typeLabel}`;
  }

  get avatarColor(): string {
    return this.statusColor;
  }

  get formattedBreed(): string {
    return this.breed;
  }

  get formattedAge(): string {
    if (!this.birthDate) return "Age unknown";
    const months = this.ageMonths;
    if (months < 12) {
      return `${months} month${months !== 1 ? "s" : ""}`;
    }
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) {
      return `${years} year${years !== 1 ? "s" : ""}`;
    }
    return `${years} yr ${remainingMonths} mo`;
  }

  get currentStage(): string {
    if (this.isCalf) return "Calf";
    if (this.isHeifer) return "Heifer";
    return this.isPregnant ? "Pregnant" : "Milking";
  }

  get isHealthy(): boolean {
    return this.healthStatus === "healthy";
  }
}
