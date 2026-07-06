import { getISTDateString } from "../utils/date";
export { getISTDateString };
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMilk } from "../src/modules/milk/hooks/useMilk";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type AnimalType = "cow" | "buffalo" | "calf";
export type HealthStatus = "healthy" | "attention" | "critical";

export const COW_BREEDS = [
  "HF (Holstein Friesian)", "Jersey", "Gir", "Sahiwal", "Tharparkar",
  "Kangayam", "Umblachery", "Bargur", "Ongole", "Kankrej", "Rathi", "Mixed/Crossbred",
];

export const BUFFALO_BREEDS = [
  "Murrah", "Surti", "Mehsana", "Jaffarabadi", "Toda (Nilgiris)",
  "Pandharpuri", "Nagpuri", "Mixed",
];

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
  lactationNumber?: number;
  lastCalvingDate?: string;
  expectedCalvingDate?: string;
  isPregnant?: boolean;
  bodyConditionScore?: number;
  weightKg?: number;
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
  time: string;
  session: "morning" | "evening" | "anytime";
  completed: boolean;
  date: string;
  animalId?: string;
  type: "milk" | "feed" | "health" | "clean" | "other" | "breeding" | "vaccination";
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

// ─── NEW: Breeding & Reproductive Management ───────────────────────────────
export type BreedingEventType =
  | "heat"
  | "insemination"
  | "pregnancy_confirmed"
  | "dry_off"
  | "calving"
  | "abort";

export interface BreedingEvent {
  id: string;
  animalId: string;
  eventType: BreedingEventType;
  date: string;
  note?: string;
  bullName?: string;
  expectedCalvingDate?: string;
  calvingGender?: "male" | "female";
}

// ─── NEW: Vaccination Schedule ─────────────────────────────────────────────
export type VaccineType =
  | "FMD"
  | "HS"
  | "BQ"
  | "Brucellosis"
  | "Theileriosis"
  | "Anthrax"
  | "PPR"
  | "Other";

export interface Vaccination {
  id: string;
  animalId: string;
  vaccineName: string;
  vaccineType: VaccineType;
  scheduledDate: string;
  administeredDate?: string;
  batchNo?: string;
  administeredBy?: string;
  cost?: number;
  nextDueDate?: string;
  note?: string;
}

// ─── NEW: Inventory Management ─────────────────────────────────────────────
export interface InventoryItem {
  id: string;
  name: string;
  category: "feed" | "medicine" | "supplement" | "equipment" | "other";
  quantity: number;
  unit: string;
  minQuantity: number;
  pricePerUnit?: number;
  lastUpdated: string;
}

// ─── Smart Alerts ─────────────────────────────────────────────────────────
export interface SmartAlert {
  id: string;
  type: "heat" | "calving" | "vaccine" | "dry_off";
  animalId: string;
  animalName: string;
  message: string;
  messageTamil: string;
  daysAway: number;
  priority: "normal" | "high" | "critical";
}

interface AppContextType {
  animals: Animal[];
  milkEntries: MilkEntry[];
  healthEvents: HealthEvent[];
  incomeEntries: IncomeEntry[];
  expenseEntries: ExpenseEntry[];
  tasks: Task[];
  milkAnomalies: MilkAnomaly[];
  breedingEvents: BreedingEvent[];
  vaccinations: Vaccination[];
  inventoryItems: InventoryItem[];
  smartAlerts: SmartAlert[];
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

  addBreedingEvent: (event: BreedingEvent) => void;
  deleteBreedingEvent: (id: string) => void;
  getAnimalBreedingEvents: (animalId: string) => BreedingEvent[];

  addVaccination: (v: Vaccination) => void;
  updateVaccination: (v: Vaccination) => void;
  deleteVaccination: (id: string) => void;
  getAnimalVaccinations: (animalId: string) => Vaccination[];
  markVaccinationDone: (id: string, date: string, batchNo?: string) => void;

  addInventoryItem: (item: InventoryItem) => void;
  updateInventoryItem: (item: InventoryItem) => void;
  deleteInventoryItem: (id: string) => void;
  adjustInventoryQuantity: (id: string, delta: number) => void;

  isLoaded: boolean;
  reloadData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
  ANIMALS: "thulirafarm_animals",
  MILK_ENTRIES: "thulirafarm_milk_entries",
  HEALTH_EVENTS: "thulirafarm_health_events",
  INCOME_ENTRIES: "thulirafarm_income",
  EXPENSE_ENTRIES: "thulirafarm_expenses",
  TASKS: "thulirafarm_tasks",
  BREEDING_EVENTS: "thulirafarm_breeding_events",
  VACCINATIONS: "thulirafarm_vaccinations",
  INVENTORY: "thulirafarm_inventory",
};

export function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function getTodayString(): string {
  return getISTDateString();
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return getISTDateString(d);
}

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA).getTime();
  const b = new Date(dateB).getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
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
      return getISTDateString(d);
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

function computeSmartAlerts(
  animals: Animal[],
  breedingEvents: BreedingEvent[],
  vaccinations: Vaccination[]
): SmartAlert[] {
  const alerts: SmartAlert[] = [];
  const today = getTodayString();

  // Heat detection: check last heat event ~21 days ago
  for (const animal of animals) {
    if (animal.type === "calf") continue;
    if (animal.isPregnant) continue;

    const animalBreeding = breedingEvents
      .filter((e) => e.animalId === animal.id)
      .sort((a, b) => b.date.localeCompare(a.date));

    const lastHeat = animalBreeding.find((e) => e.eventType === "heat");
    if (lastHeat) {
      const daysSinceHeat = daysBetween(lastHeat.date, today);
      if (daysSinceHeat >= 18 && daysSinceHeat <= 24) {
        alerts.push({
          id: `heat-${animal.id}`,
          type: "heat",
          animalId: animal.id,
          animalName: animal.name,
          message: `${animal.name} may be in heat (${daysSinceHeat} days since last heat)`,
          messageTamil: `${animal.name} இன்று ஈட்டில் இருக்கலாம் (கடந்த ஈட்டிலிருந்து ${daysSinceHeat} நாட்கள்)`,
          daysAway: 0,
          priority: "high",
        });
      }
    }

    // Calving alert
    if (animal.expectedCalvingDate) {
      const daysToCalving = daysBetween(today, animal.expectedCalvingDate);
      if (daysToCalving >= 0 && daysToCalving <= 21) {
        alerts.push({
          id: `calving-${animal.id}`,
          type: "calving",
          animalId: animal.id,
          animalName: animal.name,
          message: `${animal.name} due to calve in ${daysToCalving} day${daysToCalving !== 1 ? "s" : ""}`,
          messageTamil: `${animal.name} ${daysToCalving === 0 ? "இன்று" : `${daysToCalving} நாட்களில்`} குட்டி போடும்`,
          daysAway: daysToCalving,
          priority: daysToCalving <= 3 ? "critical" : "high",
        });
      }
    }
  }

  // Vaccine due alerts
  for (const vax of vaccinations) {
    if (vax.administeredDate) continue;
    const daysUntil = daysBetween(today, vax.scheduledDate);
    if (daysUntil >= -7 && daysUntil <= 14) {
      const animal = animals.find((a) => a.id === vax.animalId);
      if (!animal) continue;
      const overdue = daysUntil < 0;
      alerts.push({
        id: `vax-${vax.id}`,
        type: "vaccine",
        animalId: animal.id,
        animalName: animal.name,
        message: overdue
          ? `${animal.name}: ${vax.vaccineName} vaccine overdue by ${-daysUntil} days`
          : `${animal.name}: ${vax.vaccineName} vaccine due in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}`,
        messageTamil: overdue
          ? `${animal.name}: ${vax.vaccineName} தடுப்பூசி ${-daysUntil} நாட்கள் கடந்தது`
          : `${animal.name}: ${vax.vaccineName} தடுப்பூசி ${daysUntil} நாட்களில்`,
        daysAway: daysUntil,
        priority: overdue ? "critical" : daysUntil <= 3 ? "high" : "normal",
      });
    }
  }

  return alerts.sort((a, b) => a.daysAway - b.daysAway);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [milkEntries, setMilkEntries] = useState<MilkEntry[]>([]);
  const [healthEvents, setHealthEvents] = useState<HealthEvent[]>([]);
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>([]);
  const [expenseEntries, setExpenseEntries] = useState<ExpenseEntry[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milkAnomalies, setMilkAnomalies] = useState<MilkAnomaly[]>([]);
  const [breedingEvents, setBreedingEvents] = useState<BreedingEvent[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [smartAlerts, setSmartAlerts] = useState<SmartAlert[]>([]);
  const [syncStatus] = useState<"synced" | "pending" | "offline">("synced");
  const [isLoaded, setIsLoaded] = useState(false);

  const { milkEntries: modularMilkEntries } = useMilk();

  useEffect(() => {
    if (modularMilkEntries && modularMilkEntries.length > 0) {
      const mapped: MilkEntry[] = modularMilkEntries.map((e) => ({
        id: e.id,
        animalId: e.animalId,
        session: e.session,
        quantity: e.quantity,
        date: getISTDateString(e.date),
        timestamp: e.date instanceof Date ? e.date.getTime() : new Date(e.date).getTime(),
        fat: e.fat ?? undefined,
        snf: e.snf ?? undefined,
        notes: e.notes ?? undefined,
      }));
      setMilkEntries(mapped);
    }
  }, [modularMilkEntries]);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (isLoaded) {
      setSmartAlerts(computeSmartAlerts(animals, breedingEvents, vaccinations));
    }
  }, [animals, breedingEvents, vaccinations, isLoaded]);

  const reloadData = useCallback(async () => {
    await loadData();
  }, []);

  const safeParse = <T,>(data: string | null, fallback: T): T => {
    if (!data) return fallback;
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? (parsed as T) : fallback;
    } catch (e) {
      console.error("[AppContext] JSON parse failed, using fallback:", e);
      return fallback;
    }
  };

  const loadData = async () => {
    console.log('[AppContext] Starting loadData...');
    try {
      const [animalsData, milkData, healthData, incomeData, expenseData, tasksData,
        breedingData, vaccinationData, inventoryData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ANIMALS),
        AsyncStorage.getItem(STORAGE_KEYS.MILK_ENTRIES),
        AsyncStorage.getItem(STORAGE_KEYS.HEALTH_EVENTS),
        AsyncStorage.getItem(STORAGE_KEYS.INCOME_ENTRIES),
        AsyncStorage.getItem(STORAGE_KEYS.EXPENSE_ENTRIES),
        AsyncStorage.getItem(STORAGE_KEYS.TASKS),
        AsyncStorage.getItem(STORAGE_KEYS.BREEDING_EVENTS),
        AsyncStorage.getItem(STORAGE_KEYS.VACCINATIONS),
        AsyncStorage.getItem(STORAGE_KEYS.INVENTORY),
      ]);

      console.log('[AppContext] Storage data retrieved');

      const loadedAnimals = safeParse<Animal[]>(animalsData, []);
      const loadedMilk = safeParse<MilkEntry[]>(milkData, []);
      const loadedHealth = safeParse<any[]>(healthData, []);
      const loadedIncome = safeParse<any[]>(incomeData, []);
      const loadedExpense = safeParse<any[]>(expenseData, []);
      const loadedTasks = safeParse<any[]>(tasksData, []);
      const loadedBreeding = safeParse<BreedingEvent[]>(breedingData, []);
      const loadedVax = safeParse<Vaccination[]>(vaccinationData, []);
      const loadedInventory = safeParse<InventoryItem[]>(inventoryData, []);

      setAnimals(loadedAnimals);
      setMilkEntries(loadedMilk);
      setHealthEvents(loadedHealth);
      setIncomeEntries(loadedIncome);
      setExpenseEntries(loadedExpense);
      setTasks(loadedTasks);
      setBreedingEvents(loadedBreeding);
      setVaccinations(loadedVax);
      setInventoryItems(loadedInventory);

      setMilkAnomalies(computeAnomalies(loadedAnimals, loadedMilk));
      setSmartAlerts(computeSmartAlerts(loadedAnimals, loadedBreeding, loadedVax));
      console.log('[AppContext] State updated');
    } catch (e) {
      console.error('[AppContext] Error loading data:', e);
    }
    setIsLoaded(true);
    console.log('[AppContext] isLoaded set to true');
  };

  const save = async (key: string, data: unknown) => {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  };

  // ─── Animal CRUD ─────────────────────────────────────────────────────────
  const addAnimal = useCallback((animal: Animal) => {
    setAnimals((prev) => { const next = [...prev, animal]; save(STORAGE_KEYS.ANIMALS, next); return next; });
  }, []);

  const updateAnimal = useCallback((animal: Animal) => {
    setAnimals((prev) => {
      const next = prev.map((a) => (a.id === animal.id ? animal : a));
      save(STORAGE_KEYS.ANIMALS, next);
      return next;
    });
  }, []);

  const deleteAnimal = useCallback((id: string) => {
    setAnimals((prev) => { const next = prev.filter((a) => a.id !== id); save(STORAGE_KEYS.ANIMALS, next); return next; });
  }, []);

  const updateAnimalHealthStatus = useCallback((animalId: string, status: HealthStatus) => {
    setAnimals((prev) => {
      const next = prev.map((a) => a.id === animalId ? { ...a, healthStatus: status } : a);
      save(STORAGE_KEYS.ANIMALS, next);
      return next;
    });
  }, []);

  // ─── Milk ────────────────────────────────────────────────────────────────
  const addMilkEntry = useCallback((entry: MilkEntry) => {
    setMilkEntries((prevMilk) => {
      const nextMilk = [entry, ...prevMilk];
      save(STORAGE_KEYS.MILK_ENTRIES, nextMilk);

      setAnimals((prevAnimals) => {
        const nextAnimals = prevAnimals.map((a) =>
          a.id === entry.animalId ? { ...a, lastMilkEntry: entry } : a
        );
        save(STORAGE_KEYS.ANIMALS, nextAnimals);
        const newAnomalies = computeAnomalies(nextAnimals, nextMilk);
        setMilkAnomalies(newAnomalies);

        const thisAnimal = nextAnimals.find((a) => a.id === entry.animalId);
        const anomaly = newAnomalies.find((an) => an.animalId === entry.animalId);
        if (anomaly && thisAnimal && thisAnimal.healthStatus === "healthy") {
          const newStatus = anomaly.severity === "critical" ? "critical" : "attention";
          const updated = nextAnimals.map((a) =>
            a.id === entry.animalId ? { ...a, healthStatus: newStatus as HealthStatus } : a
          );
          save(STORAGE_KEYS.ANIMALS, updated);
          return updated;
        }
        return nextAnimals;
      });

      return nextMilk;
    });
  }, []);

  // ─── Health Events ───────────────────────────────────────────────────────
  const addHealthEvent = useCallback((event: HealthEvent) => {
    setHealthEvents((prev) => { const next = [event, ...prev]; save(STORAGE_KEYS.HEALTH_EVENTS, next); return next; });
  }, []);

  // ─── Income/Expense ──────────────────────────────────────────────────────
  const addIncomeEntry = useCallback((entry: IncomeEntry) => {
    setIncomeEntries((prev) => { const next = [entry, ...prev]; save(STORAGE_KEYS.INCOME_ENTRIES, next); return next; });
  }, []);

  const addExpenseEntry = useCallback((entry: ExpenseEntry) => {
    setExpenseEntries((prev) => { const next = [entry, ...prev]; save(STORAGE_KEYS.EXPENSE_ENTRIES, next); return next; });
  }, []);

  // ─── Tasks ───────────────────────────────────────────────────────────────
  const toggleTaskComplete = useCallback((id: string) => {
    setTasks((prev) => {
      const next = prev.map((t) => t.id === id ? { ...t, completed: !t.completed } : t);
      save(STORAGE_KEYS.TASKS, next);
      return next;
    });
  }, []);

  const generateDailyTasks = useCallback(() => {
    const today = getTodayString();
    setTasks((prevTasks) => {
      const existingToday = prevTasks.filter((t) => t.date === today);
      if (existingToday.length > 0) return prevTasks;

      const defaultTasks: Task[] = [
        { id: generateId(), title: "Morning Milking", time: "5:00 AM", session: "morning", completed: false, date: today, type: "milk", priority: "high" },
        { id: generateId(), title: "Morning Feed", time: "6:00 AM", session: "morning", completed: false, date: today, type: "feed", priority: "normal" },
        { id: generateId(), title: "Clean Shed", time: "6:30 AM", session: "morning", completed: false, date: today, type: "clean", priority: "normal" },
        { id: generateId(), title: "Evening Milking", time: "4:00 PM", session: "evening", completed: false, date: today, type: "milk", priority: "high" },
        { id: generateId(), title: "Evening Feed", time: "4:30 PM", session: "evening", completed: false, date: today, type: "feed", priority: "normal" },
        { id: generateId(), title: "Record Income", time: "7:00 PM", session: "evening", completed: false, date: today, type: "other", priority: "normal" },
        { id: generateId(), title: "Mineral Mix — Water Trough", time: "8:00 AM", session: "morning", completed: false, date: today, type: "feed", priority: "low" },
      ];

      const next = [...prevTasks, ...defaultTasks];
      save(STORAGE_KEYS.TASKS, next);
      return next;
    });
  }, []);

  // ─── Breeding Events ─────────────────────────────────────────────────────
  const addBreedingEvent = useCallback((event: BreedingEvent) => {
    setBreedingEvents((prev) => {
      const next = [event, ...prev];
      save(STORAGE_KEYS.BREEDING_EVENTS, next);
      return next;
    });

    if (event.eventType === "insemination" || event.eventType === "pregnancy_confirmed") {
      const expectedDate = event.expectedCalvingDate ?? addDays(event.date, 283);
      setAnimals((prevA) => {
        const nextA = prevA.map((a) =>
          a.id === event.animalId
            ? { ...a, isPregnant: true, expectedCalvingDate: expectedDate }
            : a
        );
        save(STORAGE_KEYS.ANIMALS, nextA);
        return nextA;
      });
    } else if (event.eventType === "calving") {
      setAnimals((prevA) => {
        const nextA = prevA.map((a) =>
          a.id === event.animalId
            ? {
                ...a,
                isPregnant: false,
                expectedCalvingDate: undefined,
                lastCalvingDate: event.date,
                lactationNumber: (a.lactationNumber ?? 0) + 1,
              }
            : a
        );
        save(STORAGE_KEYS.ANIMALS, nextA);
        return nextA;
      });
    } else if (event.eventType === "abort") {
      setAnimals((prevA) => {
        const nextA = prevA.map((a) =>
          a.id === event.animalId
            ? { ...a, isPregnant: false, expectedCalvingDate: undefined }
            : a
        );
        save(STORAGE_KEYS.ANIMALS, nextA);
        return nextA;
      });
    }
  }, []);

  const deleteBreedingEvent = useCallback((id: string) => {
    setBreedingEvents((prev) => { const next = prev.filter((e) => e.id !== id); save(STORAGE_KEYS.BREEDING_EVENTS, next); return next; });
  }, []);

  const getAnimalBreedingEvents = useCallback((animalId: string) => {
    return breedingEvents.filter((e) => e.animalId === animalId).sort((a, b) => b.date.localeCompare(a.date));
  }, [breedingEvents]);

  // ─── Vaccination CRUD ────────────────────────────────────────────────────
  const addVaccination = useCallback((v: Vaccination) => {
    setVaccinations((prev) => {
      const next = [v, ...prev];
      save(STORAGE_KEYS.VACCINATIONS, next);
      return next;
    });
  }, []);

  const updateVaccination = useCallback((v: Vaccination) => {
    setVaccinations((prev) => { const next = prev.map((x) => x.id === v.id ? v : x); save(STORAGE_KEYS.VACCINATIONS, next); return next; });
  }, []);

  const deleteVaccination = useCallback((id: string) => {
    setVaccinations((prev) => { const next = prev.filter((v) => v.id !== id); save(STORAGE_KEYS.VACCINATIONS, next); return next; });
  }, []);

  const markVaccinationDone = useCallback((id: string, date: string, batchNo?: string) => {
    setVaccinations((prev) => {
      const next = prev.map((v) => {
        if (v.id !== id) return v;
        let nextDue: string | undefined;
        const recurrenceMap: Partial<Record<VaccineType, number>> = {
          FMD: 180, HS: 365, BQ: 365, Anthrax: 365, PPR: 365,
        };
        const days = recurrenceMap[v.vaccineType];
        if (days) nextDue = addDays(date, days);
        return { ...v, administeredDate: date, batchNo: batchNo ?? v.batchNo, nextDueDate: nextDue };
      });
      save(STORAGE_KEYS.VACCINATIONS, next);
      return next;
    });
  }, []);

  const getAnimalVaccinations = useCallback((animalId: string) => {
    return vaccinations.filter((v) => v.animalId === animalId).sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  }, [vaccinations]);

  // ─── Inventory ───────────────────────────────────────────────────────────
  const addInventoryItem = useCallback((item: InventoryItem) => {
    setInventoryItems((prev) => { const next = [...prev, item]; save(STORAGE_KEYS.INVENTORY, next); return next; });
  }, []);

  const updateInventoryItem = useCallback((item: InventoryItem) => {
    setInventoryItems((prev) => { const next = prev.map((x) => x.id === item.id ? item : x); save(STORAGE_KEYS.INVENTORY, next); return next; });
  }, []);

  const deleteInventoryItem = useCallback((id: string) => {
    setInventoryItems((prev) => { const next = prev.filter((x) => x.id !== id); save(STORAGE_KEYS.INVENTORY, next); return next; });
  }, []);

  const adjustInventoryQuantity = useCallback((id: string, delta: number) => {
    setInventoryItems((prev) => {
      const next = prev.map((x) =>
        x.id === id ? { ...x, quantity: Math.max(0, x.quantity + delta), lastUpdated: getTodayString() } : x
      );
      save(STORAGE_KEYS.INVENTORY, next);
      return next;
    });
  }, []);

  // ─── Computed ────────────────────────────────────────────────────────────
  const getTodayMilkTotal = useCallback(() => {
    const today = getTodayString();
    return milkEntries.filter((e) => e.date === today).reduce((sum, e) => sum + e.quantity, 0);
  }, [milkEntries]);

  const getTodayIncome = useCallback(() => {
    const today = getTodayString();
    return incomeEntries.filter((e) => e.date === today).reduce((sum, e) => sum + e.totalReceived, 0);
  }, [incomeEntries]);

  const getTodayExpenses = useCallback(() => {
    const today = getTodayString();
    return expenseEntries.filter((e) => e.date === today).reduce((sum, e) => sum + e.amount, 0);
  }, [expenseEntries]);

  const getAnimalMilkTrend = useCallback((animalId: string) => {
    const last7days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return getISTDateString(d);
    });
    return last7days.map((date) =>
      milkEntries.filter((e) => e.animalId === animalId && e.date === date).reduce((sum, e) => sum + e.quantity, 0)
    );
  }, [milkEntries]);

  const get7DayFinancials = useCallback(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const date = getISTDateString(d);
      const income = incomeEntries.filter((e) => e.date === date).reduce((s, e) => s + e.totalReceived, 0);
      const expense = expenseEntries.filter((e) => e.date === date).reduce((s, e) => s + e.amount, 0);
      const label = d.toLocaleDateString("en-IN", { weekday: "short" });
      return { date: label, income, expense };
    });
  }, [incomeEntries, expenseEntries]);

  return (
    <AppContext.Provider
      value={{
        animals, milkEntries, healthEvents, incomeEntries, expenseEntries,
        tasks, milkAnomalies, breedingEvents, vaccinations, inventoryItems, smartAlerts,
        syncStatus,
        addAnimal, updateAnimal, deleteAnimal, addMilkEntry, addHealthEvent,
        addIncomeEntry, addExpenseEntry, toggleTaskComplete, generateDailyTasks,
        getTodayMilkTotal, getTodayIncome, getTodayExpenses, getAnimalMilkTrend,
        get7DayFinancials, updateAnimalHealthStatus,
        addBreedingEvent, deleteBreedingEvent, getAnimalBreedingEvents,
        addVaccination, updateVaccination, deleteVaccination, markVaccinationDone,
        getAnimalVaccinations,
        addInventoryItem, updateInventoryItem, deleteInventoryItem, adjustInventoryQuantity,
        isLoaded,
        reloadData,
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
