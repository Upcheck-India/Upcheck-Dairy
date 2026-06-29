import { Injectable, Inject } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import { inventoryItems, type InventoryItem, type InsertInventoryItem } from "@workspace/db";
import { eq } from "drizzle-orm";

@Injectable()
export class InventoryItemsRepository {
  constructor(@Inject(DatabaseService) private dbService: DatabaseService) {}

  async findById(id: number): Promise<InventoryItem | null> {
    const results = await this.dbService.drizzle
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, id))
      .limit(1);
    return results[0] || null;
  }

  async findByFarm(farmId: string): Promise<InventoryItem[]> {
    return this.dbService.drizzle
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.farmId, farmId));
  }

  async create(data: InsertInventoryItem): Promise<InventoryItem> {
    const results = await this.dbService.drizzle
      .insert(inventoryItems)
      .values(data)
      .returning();
    return results[0];
  }

  async update(id: number, data: Partial<InventoryItem>): Promise<InventoryItem> {
    const results = await this.dbService.drizzle
      .update(inventoryItems)
      .set({ ...data, lastUpdated: new Date() })
      .where(eq(inventoryItems.id, id))
      .returning();
    return results[0];
  }

  async delete(id: number): Promise<void> {
    await this.dbService.drizzle.delete(inventoryItems).where(eq(inventoryItems.id, id));
  }
}
