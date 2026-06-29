export class Farm {
  readonly id: string;
  readonly ownerId: string;
  readonly name: string;
  readonly location: string | null;
  readonly createdAt: string | null;
  readonly updatedAt: string | null;

  constructor(data: {
    id: string;
    ownerId: string;
    name: string;
    location?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  }) {
    this.id = data.id;
    this.ownerId = data.ownerId;
    this.name = data.name;
    this.location = data.location ?? null;
    this.createdAt = data.createdAt ?? null;
    this.updatedAt = data.updatedAt ?? null;
  }

  getDisplayName(): string {
    return this.name || "Unnamed Farm";
  }

  getDisplayLocation(): string {
    return this.location || "Location not set";
  }
}
