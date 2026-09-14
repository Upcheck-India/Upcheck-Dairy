import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFarm } from "@/src/modules/farms/hooks/useFarm";
import { useAnimals } from "@/src/modules/animals/hooks/useAnimals";

export interface AnimalCategory {
  id: string;
  name: string;
  desc?: string;
  color: string;
  icon: string;
  /**
   * Built-in categories are the ones the API's `animal_status` enum accepts, so
   * only these can be written onto an animal. Custom categories are display-only
   * until that enum is widened on the backend.
   */
  isDefault?: boolean;
  createdAt?: string;
}

interface CategoryContextType {
  categories: AnimalCategory[];
  loading: boolean;
  addCategory: (name: string, desc?: string, color?: string) => Promise<AnimalCategory>;
  updateCategory: (id: string, name: string, desc?: string, color?: string) => Promise<AnimalCategory>;
  deleteCategory: (id: string, reassignToCategoryId?: string) => Promise<void>;
  getCategoryById: (id: string) => AnimalCategory | undefined;
  refreshCategories: () => Promise<void>;
}

export const CATEGORY_COLORS = [
  "#7c3aed",
  "#ef4444",
  "#2563eb",
  "#ea580c",
  "#16a34a",
  "#0ea5e9",
  "#db2777",
  "#4b5563",
];

export const DEFAULT_CATEGORIES: AnimalCategory[] = [
  {
    id: "lactating",
    name: "Lactating",
    desc: "Animals that are currently giving milk",
    color: "#7c3aed",
    icon: "cow",
    isDefault: true,
  },
  {
    id: "pregnant",
    name: "Pregnant",
    desc: "Pregnant animals",
    color: "#ef4444",
    icon: "heart",
    isDefault: true,
  },
  {
    id: "dry",
    name: "Dry",
    desc: "Animals not giving milk",
    color: "#2563eb",
    icon: "water-off",
    isDefault: true,
  },
  {
    id: "calf",
    name: "Calves",
    desc: "Young animals (not weaned)",
    color: "#ea580c",
    icon: "baby-bottle",
    isDefault: true,
  },
  {
    id: "other",
    name: "Others",
    desc: "Bulls, sick, in treatment, heifers, etc.",
    color: "#4b5563",
    icon: "dots-horizontal",
    isDefault: true,
  },
];

const CategoryContext = createContext<CategoryContextType | null>(null);

export function CategoryProvider({ children }: { children: React.ReactNode }) {
  const { activeFarm } = useFarm();
  const { animals, updateAnimal } = useAnimals();
  const [categories, setCategories] = useState<AnimalCategory[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState<boolean>(false);

  const storageKey = useMemo(() => {
    return activeFarm?.id ? `@upcheck_categories_${activeFarm.id}` : "@upcheck_categories_default";
  }, [activeFarm?.id]);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) {
        const parsed: AnimalCategory[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCategories(parsed);
          return;
        }
      }
      setCategories(DEFAULT_CATEGORIES);
      await AsyncStorage.setItem(storageKey, JSON.stringify(DEFAULT_CATEGORIES));
    } catch (err) {
      console.warn("Failed to load categories from storage:", err);
      setCategories(DEFAULT_CATEGORIES);
    } finally {
      setLoading(false);
    }
  }, [storageKey]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const saveCategories = async (updated: AnimalCategory[]) => {
    setCategories(updated);
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (err) {
      console.warn("Failed to save categories:", err);
    }
  };

  const assertNameAvailable = (list: AnimalCategory[], name: string, ignoreId?: string) => {
    const clash = list.some(
      (c) => c.id !== ignoreId && c.name.trim().toLowerCase() === name.toLowerCase()
    );
    if (clash) throw new Error(`A category named "${name}" already exists.`);
  };

  const addCategory = useCallback(
    async (name: string, desc?: string, color?: string): Promise<AnimalCategory> => {
      const cleanName = name.trim();
      if (!cleanName) throw new Error("Category name cannot be empty");
      assertNameAvailable(categories, cleanName);

      const newCategory: AnimalCategory = {
        id: `category_custom_${Date.now()}`,
        name: cleanName,
        desc: desc?.trim() || undefined,
        color: color || CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length],
        icon: "shape-outline",
        isDefault: false,
        createdAt: new Date().toISOString(),
      };

      await saveCategories([...categories, newCategory]);
      return newCategory;
    },
    [categories, storageKey]
  );

  const updateCategory = useCallback(
    async (id: string, name: string, desc?: string, color?: string): Promise<AnimalCategory> => {
      const cleanName = name.trim();
      if (!cleanName) throw new Error("Category name cannot be empty");

      const existingIndex = categories.findIndex((c) => c.id === id);
      if (existingIndex === -1) throw new Error("Category not found");
      assertNameAvailable(categories, cleanName, id);

      const updatedCategory: AnimalCategory = {
        ...categories[existingIndex],
        name: cleanName,
        desc: desc !== undefined ? desc.trim() : categories[existingIndex].desc,
        color: color || categories[existingIndex].color,
      };

      const updated = [...categories];
      updated[existingIndex] = updatedCategory;
      await saveCategories(updated);
      return updatedCategory;
    },
    [categories, storageKey]
  );

  const deleteCategory = useCallback(
    async (id: string, reassignToCategoryId?: string) => {
      const target = categories.find((c) => c.id === id);
      if (!target) throw new Error("Category not found");
      if (categories.length <= 1) {
        throw new Error("Cannot delete the only category. At least one category must exist.");
      }

      const remaining = categories.filter((c) => c.id !== id);

      if (target.isDefault) {
        // Animals carry a built-in category as their status, so they need another
        // built-in one to move to.
        const fallback =
          remaining.find((c) => c.isDefault && c.id === reassignToCategoryId) ??
          remaining.find((c) => c.isDefault);
        if (!fallback) {
          throw new Error(
            "At least one built-in category must remain so animals always have a status."
          );
        }

        const affected = animals.filter((a) => a.status === id);
        for (const animal of affected) {
          await updateAnimal(Number(animal.id), { status: fallback.id as any });
        }
      }

      await saveCategories(remaining);
    },
    [categories, animals, updateAnimal, storageKey]
  );

  const getCategoryById = useCallback(
    (id: string) => categories.find((c) => c.id === id),
    [categories]
  );

  const value = useMemo(
    () => ({
      categories,
      loading,
      addCategory,
      updateCategory,
      deleteCategory,
      getCategoryById,
      refreshCategories: loadCategories,
    }),
    [categories, loading, addCategory, updateCategory, deleteCategory, getCategoryById, loadCategories]
  );

  return <CategoryContext.Provider value={value}>{children}</CategoryContext.Provider>;
}

export function useCategories() {
  const ctx = useContext(CategoryContext);
  if (!ctx) {
    throw new Error("useCategories must be used within a CategoryProvider");
  }
  return ctx;
}
