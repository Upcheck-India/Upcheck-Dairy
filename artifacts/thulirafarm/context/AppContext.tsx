import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type AnimalType = "cow" | "buffalo" | "calf";
export type HealthStatus = "healthy" | "attention" | "critical";

export interface Animal {
  id: string;
  name: string;
  type: AnimalType;
  breed: string;
  tagNumber: string;
  photoUri?: string;
  healthStatus: HealthStatus;
  lastMilkEntry?: MilkEntry;
  notes?: string;
  birthDate?: string;
  nextVaccinationDate?: string;
  nextDeliveryDate?: string;
}

export interface MilkEntry {
  id: string;
  animalId: string;
  session: "morning" | "evening";
  quantity: number;
  date: string;
  timestamp: number;
  fat?: number;
  snf?: number;
  notes?: string;
}

export interface HealthEvent {
  id: string;
  animalId: string;
  date: string;
  type: "vaccination" | "treatment" | "observation" | "diagnosis";
  description: string;
  veterinarianName?: string;
  cost?: number;
  followUpDate?: string;
}

export interface IncomeEntry {
  id: string;
  date: string;
  buyer: string;
  quantitySold: number;
  ratePerLitre: number;
  totalExpected: number;
  totalReceived: number;
  fatPercentage?: number;
  snfPercentage?: number;
  notes?: string;
}

export interface ExpenseEntry {
  id: string;
  date: string;
  category: "feed" | "medicine" | "labor" | "equipment" | "other";
  description: string;
  amount: number;
}

export interface Task {
  id: string;
  title: string;
  titleTamil: string;
  time: string;
  session: "morning" | "evening" | "anytime";
  completed: boolean;
  date: string;
  animalId?: string;
  type: "milk" | "feed" | "health" | "clean" | "other";
  priority: "low" | "normal" | "high" | "critical";
}

export interface MilkAnomaly {
  animalId: string;
  animalName: string;
  dropPercent: number;
  todayTotal: number;
  avgTotal: number;
  severity: "attention" | "critical";
}

interface AppContextType {
  animals: Animal[];
  milkEntries: MilkEntry[];
  healthEvents: HealthEvent[];
  incomeEntries: IncomeEntry[];
  expenseEntries: ExpenseEntry[];
  tasks: Task[];
  milkAnomalies: MilkAnomaly[];
  syncStatus: "synced" | "pending" | "offline";
  addAnimal: (animal: Animal) => void;
  updateAnimal: (animal: Animal) => void;
  deleteAnimal: (id: string) => void;
  addMilkEntry: (entry: MilkEntry) => void;
  addHealthEvent: (event: HealthEvent) => void;
  addIncomeEntry: (entry: IncomeEntry) => void;
  addExpenseEntry: (entry: ExpenseEntry) => void;
  toggleTaskComplete: (id: string) => void;
  generateDailyTasks: () => void;
  getTodayMilkTotal: () => number;
  getTodayIncome: () => number;
  getTodayExpenses: () => number;
  getAnimalMilkTrend: (animalId: string) => number[];
  get7DayFinancials: () => Array<{ date: string; income: number; expense: number }>;
  updateAnimalHealthStatus: (animalId: string, status: HealthStatus) => void;
  isLoaded: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
  ANIMALS: "thulirafarm_animals",
  MILK_ENTRIES: "thulirafarm_milk_entries",
  HEALTH_EVENTS: "thulirafarm_health_events",
  INCOME_ENTRIES: "thulirafarm_income",
  EXPENSE_ENTRIES: "thulirafarm_expenses",
  TASKS: "thulirafarm_tasks",
};

export function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

function computeAnomalies(animals: Animal[], milkEntries: MilkEntry[]): MilkAnomaly[] {
  const today = getTodayString();
  const anomalies: MilkAnomaly[] = [];

  for (const animal of animals) {
    if (animal.type === "calf") continue;

    const todayMilk = milkEntries
      .filter((e) => e.animalId === animal.id && e.date === today)
      .reduce((s, e) => s + e.quantity, 0);

    if (todayMilk === 0) continue;

    const prev3Days = Array.from({ length: 3 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (i + 1));
      return d.toISOString().split("T")[0];
    });

    const prevTotals = prev3Days
      .map((date) =>
        milkEntries
          .filter((e) => e.animalId === animal.id && e.date === date)
          .reduce((s, e) => s + e.quantity, 0)
      )
      .filter((v) => v > 0);

    if (prevTotals.length === 0) continue;

    const avg = prevTotals.reduce((s, v) => s + v, 0) / prevTotals.length;
    if (avg === 0) continue;

    const dropPercent = ((avg - todayMilk) / avg) * 100;

    if (dropPercent >= 15) {
      anomalies.push({
        animalId: animal.id,
        animalName: animal.name,
        dropPercent: Math.round(dropPercent),
        todayTotal: todayMilk,
        avgTotal: Math.round(avg * 10) / 10,
        severity: dropPercent >= 30 ? "critical" : "attention",
      });
    }
  }

  return anomalies;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [milkEntries, setMilkEntries] = useState<MilkEntry[]>([]);
  const [healthEvents, setHealthEvents] = useState<HealthEvent[]>([]);
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>([]);
  const [expenseEntries, setExpenseEntries] = useState<ExpenseEntry[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milkAnomalies, setMilkAnomalies] = useState<MilkAnomaly[]>([]);
  const [syncStatus] = useState<"synced" | "pending" | "offline">("synced");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [
        animalsData,
        milkData,
        healthData,
        incomeData,
        expenseData,
        tasksData,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ANIMALS),
        AsyncStorage.getItem(STORAGE_KEYS.MILK_ENTRIES),
        AsyncStorage.getItem(STORAGE_KEYS.HEALTH_EVENTS),
        AsyncStorage.getItem(STORAGE_KEYS.INCOME_ENTRIES),
        AsyncStorage.getItem(STORAGE_KEYS.EXPENSE_ENTRIES),
        AsyncStorage.getItem(STORAGE_KEYS.TASKS),
      ]);

      const loadedAnimals: Animal[] = animalsData ? JSON.parse(animalsData) : [];
      const loadedMilk: MilkEntry[] = milkData ? JSON.parse(milkData) : [];

      if (animalsData) setAnimals(loadedAnimals);
      if (milkData) setMilkEntries(loadedMilk);
      if (healthData) setHealthEvents(JSON.parse(healthData));
      if (incomeData) setIncomeEntries(JSON.parse(incomeData));
      if (expenseData) setExpenseEntries(JSON.parse(expenseData));
      if (tasksData) setTasks(JSON.parse(tasksData));

      setMilkAnomalies(computeAnomalies(loadedAnimals, loadedMilk));
    } catch {
      // ignore load errors
    }
    setIsLoaded(true);
  };

  const saveAnimals = async (data: Animal[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.ANIMALS, JSON.stringify(data));
  };
  const saveMilk = async (data: MilkEntry[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.MILK_ENTRIES, JSON.stringify(data));
  };
  const saveHealth = async (data: HealthEvent[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.HEALTH_EVENTS, JSON.stringify(data));
  };
  const saveIncome = async (data: IncomeEntry[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.INCOME_ENTRIES, JSON.stringify(data));
  };
  const saveExpenses = async (data: ExpenseEntry[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.EXPENSE_ENTRIES, JSON.stringify(data));
  };
  const saveTasks = async (data: Task[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(data));
  };

  const addAnimal = useCallback((animal: Animal) => {
    setAnimals((prev) => {
      const next = [...prev, animal];
      saveAnimals(next);
      return next;
    });
  }, []);

  const updateAnimal = useCallback((animal: Animal) => {
    setAnimals((prev) => {
      const next = prev.map((a) => (a.id === animal.id ? animal : a));
      saveAnimals(next);
      return next;
    });
  }, []);

  const deleteAnimal = useCallback((id: string) => {
    setAnimals((prev) => {
      const next = prev.filter((a) => a.id !== id);
      saveAnimals(next);
      return next;
    });
  }, []);

  const updateAnimalHealthStatus = useCallback((animalId: string, status: HealthStatus) => {
    setAnimals((prev) => {
      const next = prev.map((a) => a.id === animalId ? { ...a, healthStatus: status } : a);
      saveAnimals(next);
      return next;
    });
  }, []);

  const addMilkEntry = useCallback((entry: MilkEntry) => {
    setMilkEntries((prevMilk) => {
      const nextMilk = [entry, ...prevMilk];
      saveMilk(nextMilk);

      setAnimals((prevAnimals) => {
        const nextAnimals = prevAnimals.map((a) =>
          a.id === entry.animalId ? { ...a, lastMilkEntry: entry } : a
        );
        saveAnimals(nextAnimals);

        const newAnomalies = computeAnomalies(nextAnimals, nextMilk);
        setMilkAnomalies(newAnomalies);

        const thisAnimal = nextAnimals.find((a) => a.id === entry.animalId);
        const anomaly = newAnomalies.find((an) => an.animalId === entry.animalId);
        if (anomaly && thisAnimal) {
          const newStatus = anomaly.severity === "critical" ? "critical" : "attention";
          if (thisAnimal.healthStatus === "healthy") {
            const updated = nextAnimals.map((a) =>
              a.id === entry.animalId ? { ...a, healthStatus: newStatus as HealthStatus } : a
            );
            saveAnimals(updated);
            return updated;
          }
        }

        return nextAnimals;
      });

      return nextMilk;
    });
  }, []);

  const addHealthEvent = useCallback((event: HealthEvent) => {
    setHealthEvents((prev) => {
      const next = [event, ...prev];
      saveHealth(next);
      return next;
    });
  }, []);

  const addIncomeEntry = useCallback((entry: IncomeEntry) => {
    setIncomeEntries((prev) => {
      const next = [entry, ...prev];
      saveIncome(next);
      return next;
    });
  }, []);

  const addExpenseEntry = useCallback((entry: ExpenseEntry) => {
    setExpenseEntries((prev) => {
      const next = [entry, ...prev];
      saveExpenses(next);
      return next;
    });
  }, []);

  const toggleTaskComplete = useCallback((id: string) => {
    setTasks((prev) => {
      const next = prev.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      );
      saveTasks(next);
      return next;
    });
  }, []);

  const generateDailyTasks = useCallback(() => {
    const today = getTodayString();
    setTasks((prevTasks) => {
      const existingToday = prevTasks.filter((t) => t.date === today);
      if (existingToday.length > 0) return prevTasks;

      const defaultTasks: Task[] = [
        {
          id: generateId(),
          title: "Morning Milking",
          titleTamil: "காலை கறவை",
          time: "5:00 AM",
          session: "morning",
          completed: false,
          date: today,
          type: "milk",
          priority: "high",
        },
        {
          id: generateId(),
          title: "Morning Feed",
          titleTamil: "காலை தீவனம்",
          time: "6:00 AM",
          session: "morning",
          completed: false,
          date: today,
          type: "feed",
          priority: "normal",
        },
        {
          id: generateId(),
          title: "Clean Shed",
          titleTamil: "தொழுவம் சுத்தம்",
          time: "6:30 AM",
          session: "morning",
          completed: false,
          date: today,
          type: "clean",
          priority: "normal",
        },
        {
          id: generateId(),
          title: "Evening Milking",
          titleTamil: "மாலை கறவை",
          time: "4:00 PM",
          session: "evening",
          completed: false,
          date: today,
          type: "milk",
          priority: "high",
        },
        {
          id: generateId(),
          title: "Evening Feed",
          titleTamil: "மாலை தீவனம்",
          time: "4:30 PM",
          session: "evening",
          completed: false,
          date: today,
          type: "feed",
          priority: "normal",
        },
        {
          id: generateId(),
          title: "Record Income",
          titleTamil: "வருமானம் பதிவு",
          time: "7:00 PM",
          session: "evening",
          completed: false,
          date: today,
          type: "other",
          priority: "normal",
        },
        {
          id: generateId(),
          title: "Mineral Mix — Water Trough",
          titleTamil: "தண்ணீர் தொட்டி சுத்தம்",
          time: "8:00 AM",
          session: "morning",
          completed: false,
          date: today,
          type: "feed",
          priority: "low",
        },
      ];

      const next = [...prevTasks, ...defaultTasks];
      saveTasks(next);
      return next;
    });
  }, []);

  const getTodayMilkTotal = useCallback(() => {
    const today = getTodayString();
    return milkEntries
      .filter((e) => e.date === today)
      .reduce((sum, e) => sum + e.quantity, 0);
  }, [milkEntries]);

  const getTodayIncome = useCallback(() => {
    const today = getTodayString();
    return incomeEntries
      .filter((e) => e.date === today)
      .reduce((sum, e) => sum + e.totalReceived, 0);
  }, [incomeEntries]);

  const getTodayExpenses = useCallback(() => {
    const today = getTodayString();
    return expenseEntries
      .filter((e) => e.date === today)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenseEntries]);

  const getAnimalMilkTrend = useCallback(
    (animalId: string) => {
      const last7days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split("T")[0];
      });
      return last7days.map((date) => {
        return milkEntries
          .filter((e) => e.animalId === animalId && e.date === date)
          .reduce((sum, e) => sum + e.quantity, 0);
      });
    },
    [milkEntries]
  );

  const get7DayFinancials = useCallback(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const date = d.toISOString().split("T")[0];
      const income = incomeEntries
        .filter((e) => e.date === date)
        .reduce((s, e) => s + e.totalReceived, 0);
      const expense = expenseEntries
        .filter((e) => e.date === date)
        .reduce((s, e) => s + e.amount, 0);
      const label = d.toLocaleDateString("ta-IN", { weekday: "short" });
      return { date: label, income, expense };
    });
  }, [incomeEntries, expenseEntries]);

  return (
    <AppContext.Provider
      value={{
        animals,
        milkEntries,
        healthEvents,
        incomeEntries,
        expenseEntries,
        tasks,
        milkAnomalies,
        syncStatus,
        addAnimal,
        updateAnimal,
        deleteAnimal,
        addMilkEntry,
        addHealthEvent,
        addIncomeEntry,
        addExpenseEntry,
        toggleTaskComplete,
        generateDailyTasks,
        getTodayMilkTotal,
        getTodayIncome,
        getTodayExpenses,
        getAnimalMilkTrend,
        get7DayFinancials,
        updateAnimalHealthStatus,
        isLoaded,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export { generateId, getTodayString };
