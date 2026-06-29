import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { InventoryItem } from "../models/InventoryItem";
import { inventoryRepository } from "../api/InventoryRepository";
import { CreateInventoryItemRequestDto, UpdateInventoryItemRequestDto } from "../types/InventoryDto";
import { useFarm } from "../../../modules/farms/hooks/useFarm";

interface InventoryContextType {
  loading: boolean;
  error: Error | null;
  inventoryItems: InventoryItem[];
  createItem: (dto: CreateInventoryItemRequestDto) => Promise<InventoryItem>;
  updateItem: (id: number, dto: UpdateInventoryItemRequestDto) => Promise<InventoryItem>;
  removeItem: (id: number) => Promise<void>;
  adjustQuantity: (id: number, delta: number) => Promise<InventoryItem>;
  refresh: () => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | null>(null);

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const { activeFarm } = useFarm();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchInventory = useCallback(async (farmId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await inventoryRepository.getInventoryItems(farmId);
      setInventoryItems(data);
    } catch (e: any) {
      setError(e instanceof Error ? e : new Error(e.message || "Failed to load inventory items"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeFarm?.id) {
      fetchInventory(activeFarm.id);
    } else {
      setInventoryItems([]);
    }
  }, [activeFarm?.id, fetchInventory]);

  const createItem = async (dto: CreateInventoryItemRequestDto) => {
    setError(null);
    setLoading(true);
    try {
      const newItem = await inventoryRepository.createInventoryItem(dto);
      setInventoryItems(prev => [...prev, newItem]);
      return newItem;
    } catch (e: any) {
      const err = e instanceof Error ? e : new Error(e.message || "Failed to create inventory item");
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (id: number, dto: UpdateInventoryItemRequestDto) => {
    setError(null);
    setLoading(true);
    try {
      const updated = await inventoryRepository.updateInventoryItem(id, dto);
      setInventoryItems(prev => prev.map(item => (Number(item.id) === id ? updated : item)));
      return updated;
    } catch (e: any) {
      const err = e instanceof Error ? e : new Error(e.message || "Failed to update inventory item");
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (id: number) => {
    setError(null);
    setLoading(true);
    try {
      await inventoryRepository.deleteInventoryItem(id);
      setInventoryItems(prev => prev.filter(item => Number(item.id) !== id));
    } catch (e: any) {
      const err = e instanceof Error ? e : new Error(e.message || "Failed to delete inventory item");
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const adjustQuantity = async (id: number, delta: number) => {
    const item = inventoryItems.find(x => Number(x.id) === id);
    if (!item) throw new Error("Item not found");
    const newQty = Math.max(0, item.quantity + delta);
    return updateItem(id, { quantity: newQty });
  };

  const refresh = async () => {
    if (activeFarm?.id) {
      await fetchInventory(activeFarm.id);
    }
  };

  return (
    <InventoryContext.Provider value={{
      loading,
      error,
      inventoryItems,
      createItem,
      updateItem,
      removeItem,
      adjustQuantity,
      refresh,
    }}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventoryContext() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventoryContext must be used within InventoryProvider");
  return ctx;
}
