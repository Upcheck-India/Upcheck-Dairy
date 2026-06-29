# UpCheck Dairy Development Roadmap

This roadmap defines the implementation order for UpCheck Dairy feature modules.

---

## Completed Phases

### ✅ Phase 1: Core Foundation & Farms Module
- [x] Class-based `ApiClient` singleton (in-memory configure/reset)
- [x] Type-safe namespace partition storage
- [x] Core EventBus emitter
- [x] Farms domain model, repository layer, and mapper
- [x] React `FarmProvider` and `useFarm` custom hook
- [x] Reusable bottom-sheet `FarmSelector`
- [x] Standalone `/farms` setup and guard redirection in `_layout.tsx`

### ✅ Phase 2: Animals Module
- [x] Expose NestJS backend `GET /animals` header-scoped endpoint
- [x] Create domain model `Animal.ts` with UI derived properties
- [x] Create `AnimalDto.ts` requests and responses
- [x] Create mapper `AnimalMapper.ts`
- [x] Create singleton repository `AnimalRepository.ts`
- [x] Create `AnimalProvider.tsx` context & `useAnimals.ts` custom hook
- [x] Wrap `_layout.tsx` with `AnimalProvider`
- [x] Migrate dashboard screen `index.tsx`
- [x] Integrate `AddAnimalModal.tsx` and update `AnimalCard.tsx`

---

## Upcoming Phases

### ✅ Phase 3: Milk Logging
- [x] Migrate `MilkEntry` to custom Domain Model class (`modules/milk/models/MilkEntry.ts`)
- [x] Create DTO types (`CreateMilkEntryRequestDto`, `MilkEntryResponseDto`)
- [x] Implement `MilkRepository` fetching from header-scoped backend (`GET /milk`) and caching offline
- [x] Implement `MilkProvider` and custom `useMilk` hook (re-fetches scoped by `activeFarm.id`)
- [x] Integrate Milk UI components: `MilkCard`, `MilkChart`, `AddMilkModal`

### ✅ Phase 4: Health
- [x] Migrate treatments, vaccinations, and diagnoses to `HealthRepository`
- [x] Implement `HealthProvider` and custom `useHealth` hook
- [x] Rebuild Treatments and Vaccination history logs

### ✅ Phase 5: Breeding
- [x] Rebuild heat cycle records, pregnancy checks, calving history, and breeding events under `BreedingRepository`
- [x] Implement `BreedingProvider` and custom `useBreeding` hook

### ✅ Phase 6: Inventory
- [x] Rebuild Feed, Medicine, Equipment, and Supplies under farm-scoped `InventoryRepository`
- [x] Implement `InventoryProvider` and custom `useInventory` hook

### ✅ Phase 7: Tasks
- [x] Rebuild daily tasks, feed schedules, and reminders under `TaskRepository`
- [x] Implement `TaskProvider` and custom `useTasks` hook

### ✅ Phase 8: Finance
- [x] Rebuild Income, Expenses, milk sales, and feed costs under `FinanceRepository`
- [x] Implement `FinanceProvider` and custom `useFinance` hook

### ✅ Phase 10: Dashboard
- [x] Refactor dashboard composition layer (combines data from `useAnimals`, `useMilk`, `useFinance`, etc.)

### ⏹ Phase 9: Offline Sync (Next)
- [ ] Build conflict resolution engine, retry queue, background synchronization, and stale data policies

### ⏹ Phase 11: Analytics
- [ ] Implement `AnalyticsRepository` fetching cost-to-feed, production forecasting, and profit margins

### ⏹ Phase 12: AI Integration (GauGuru)
- [ ] Build Chat screens and voice assistance orchestrating the structured feature module APIs
