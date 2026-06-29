import type { ExpenseCategory } from "../types/FinanceDto";

export class IncomeEntry {
  id: number;
  farmId: string;
  date: Date;
  buyer: string;
  quantitySold: number;
  ratePerLitre: number;
  totalExpected: number;
  totalReceived: number;
  fatPercentage: number | null;
  snfPercentage: number | null;
  notes: string | null;
  createdAt: Date;

  constructor(data: {
    id: number;
    farmId: string;
    date: Date;
    buyer: string;
    quantitySold: number;
    ratePerLitre: number;
    totalExpected: number;
    totalReceived: number;
    fatPercentage: number | null;
    snfPercentage: number | null;
    notes: string | null;
    createdAt: Date;
  }) {
    this.id = data.id;
    this.farmId = data.farmId;
    this.date = data.date;
    this.buyer = data.buyer;
    this.quantitySold = data.quantitySold;
    this.ratePerLitre = data.ratePerLitre;
    this.totalExpected = data.totalExpected;
    this.totalReceived = data.totalReceived;
    this.fatPercentage = data.fatPercentage;
    this.snfPercentage = data.snfPercentage;
    this.notes = data.notes;
    this.createdAt = data.createdAt;
  }

  get isPaymentPending(): boolean {
    return this.totalReceived < this.totalExpected;
  }

  get pendingAmount(): number {
    return Math.max(0, this.totalExpected - this.totalReceived);
  }

  get dateString(): string {
    return this.date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }
}

export class ExpenseEntry {
  id: number;
  farmId: string;
  date: Date;
  category: ExpenseCategory;
  description: string;
  amount: number;
  createdAt: Date;

  constructor(data: {
    id: number;
    farmId: string;
    date: Date;
    category: ExpenseCategory;
    description: string;
    amount: number;
    createdAt: Date;
  }) {
    this.id = data.id;
    this.farmId = data.farmId;
    this.date = data.date;
    this.category = data.category;
    this.description = data.description;
    this.amount = data.amount;
    this.createdAt = data.createdAt;
  }

  get dateString(): string {
    return this.date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }
}
