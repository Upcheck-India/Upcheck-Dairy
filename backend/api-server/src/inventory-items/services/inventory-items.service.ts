import { Injectable, Inject, NotFoundException, ForbiddenException } from "@nestjs/common";
import { InventoryItemsRepository } from "../repositories/inventory-items.repository";
import { FarmsRepository } from "../../farms/repositories/farms.repository";
import { CreateInventoryItemDto } from "../dto/create-inventory-item.dto";
import { UpdateInventoryItemDto } from "../dto/update-inventory-item.dto";
import { type InventoryItem } from "@workspace/db";

@Injectable()
export class InventoryItemsService {
  constructor(
    @Inject(InventoryItemsRepository) private inventoryItemsRepository: InventoryItemsRepository,
    @Inject(FarmsRepository) private farmsRepository: FarmsRepository
  ) {}

  private async verifyFarmOwnership(farmId: string, ownerFarmerId: string): Promise<void> {
    const farm = await this.farmsRepository.findById(farmId);
    if (!farm) {
      throw new NotFoundException("Farm not found");
    }
    if (farm.ownerFarmerId !== ownerFarmerId) {
      throw new ForbiddenException("You do not own this farm");
    }
  }

  async create(ownerFarmerId: string, dto: CreateInventoryItemDto): Promise<InventoryItem> {
    await this.verifyFarmOwnership(dto.farmId, ownerFarmerId);
    return this.inventoryItemsRepository.create({
      ...dto,
      quantity: dto.quantity.toString(),
      minQuantity: dto.minQuantity.toString(),
      pricePerUnit: dto.pricePerUnit ? dto.pricePerUnit.toString() : null,
      lastUpdated: new Date(),
    });
  }

  async getFarmHistory(ownerFarmerId: string, farmId: string): Promise<InventoryItem[]> {
    await this.verifyFarmOwnership(farmId, ownerFarmerId);
    return this.inventoryItemsRepository.findByFarm(farmId);
  }

  async update(ownerFarmerId: string, id: number, dto: UpdateInventoryItemDto): Promise<InventoryItem> {
    const item = await this.inventoryItemsRepository.findById(id);
    if (!item) {
      throw new NotFoundException("Inventory item not found");
    }
    await this.verifyFarmOwnership(item.farmId, ownerFarmerId);

    const updates: Partial<InventoryItem> = {
      ...dto,
      quantity: dto.quantity !== undefined ? dto.quantity.toString() : undefined,
      minQuantity: dto.minQuantity !== undefined ? dto.minQuantity.toString() : undefined,
      pricePerUnit: dto.pricePerUnit !== undefined ? (dto.pricePerUnit ? dto.pricePerUnit.toString() : null) : undefined,
    } as any;

    return this.inventoryItemsRepository.update(id, updates);
  }

  async delete(ownerFarmerId: string, id: number): Promise<void> {
    const item = await this.inventoryItemsRepository.findById(id);
    if (!item) {
      throw new NotFoundException("Inventory item not found");
    }
    await this.verifyFarmOwnership(item.farmId, ownerFarmerId);
    await this.inventoryItemsRepository.delete(id);
  }
}
