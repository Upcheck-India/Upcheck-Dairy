export class InventoryItem {
  readonly id: string;
  readonly farmId: string;
  readonly name: string;
  readonly category: "feed" | "medicine" | "supplement" | "equipment" | "other";
  readonly quantity: number;
  readonly unit: string;
  readonly minQuantity: number;
  readonly pricePerUnit: number | null;
  readonly lastUpdated: Date;
  readonly createdAt: Date | null;

  constructor(data: {
    id: string;
    farmId: string;
    name: string;
    category: "feed" | "medicine" | "supplement" | "equipment" | "other";
    quantity: number;
    unit: string;
    minQuantity: number;
    pricePerUnit?: number | null;
    lastUpdated: Date;
    createdAt?: Date | null;
  }) {
    this.id = data.id;
    this.farmId = data.farmId;
    this.name = data.name;
    this.category = data.category;
    this.quantity = data.quantity;
    this.unit = data.unit;
    this.minQuantity = data.minQuantity;
    this.pricePerUnit = data.pricePerUnit ?? null;
    this.lastUpdated = data.lastUpdated;
    this.createdAt = data.createdAt ?? null;
  }

  get isLowStock(): boolean {
    return this.quantity <= this.minQuantity && this.minQuantity > 0;
  }

  get totalValue(): number {
    return this.quantity * (this.pricePerUnit ?? 0);
  }

  get formattedTotalValue(): string {
    return `₹${this.totalValue.toFixed(2)}`;
  }

  get categoryLabel(): string {
    return this.category.charAt(0).toUpperCase() + this.category.slice(1);
  }
}
