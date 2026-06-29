import { useInventoryContext } from "../context/InventoryProvider";

export function useInventory() {
  const context = useInventoryContext();
  return {
    loading: context.loading,
    error: context.error,
    inventoryItems: context.inventoryItems,
    createItem: context.createItem,
    updateItem: context.updateItem,
    removeItem: context.removeItem,
    adjustQuantity: context.adjustQuantity,
    refresh: context.refresh,
  };
}
