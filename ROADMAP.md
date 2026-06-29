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

### ⏹ Phase 3: Milk Logging (Next)
- [ ] Migrate `MilkEntry` to custom Domain Model class (`modules/milk/models/MilkEntry.ts`)
- [ ] Create DTO types (`CreateMilkEntryRequestDto`, `MilkEntryResponseDto`)
- [ ] Implement `MilkRepository` fetching from header-scoped backend (`GET /milk`) and caching offline
- [ ] Implement `MilkProvider` and custom `useMilk` hook (re-fetches scoped by `activeFarm.id`)
- [ ] Integrate Milk UI components: `MilkCard`, `MilkChart`, `AddMilkModal`

### ⏹ Phase 4: Health
- [ ] Migrate treatments, vaccinations, and diagnoses to `HealthRepository`
- [ ] Implement `HealthProvider` and custom `useHealth` hook
- [ ] Rebuild Treatments and Vaccination history logs

### ⏹ Phase 5: Breeding
- [ ] Rebuild heat cycle records, pregnancy checks, calving history, and breeding events under `BreedingRepository`
- [ ] Implement `BreedingProvider` and custom `useBreeding` hook

### ⏹ Phase 6: Inventory
- [ ] Rebuild Feed, Medicine, Equipment, and Supplies under farm-scoped `InventoryRepository`
- [ ] Implement `InventoryProvider` and custom `useInventory` hook

### ⏹ Phase 7: Tasks
- [ ] Rebuild daily tasks, feed schedules, and reminders under `TaskRepository`
- [ ] Implement `TaskProvider` and custom `useTasks` hook

### ⏹ Phase 8: Finance
- [ ] Rebuild Income, Expenses, milk sales, and feed costs under `FinanceRepository`
- [ ] Implement `FinanceProvider` and custom `useFinance` hook

### ⏹ Phase 9: Offline Sync
- [ ] Build conflict resolution engine, retry queue, background synchronization, and stale data policies

### ⏹ Phase 10: Dashboard
- [ ] Refactor dashboard composition layer (combines data from `useAnimals`, `useMilk`, `useFinance`, etc.)

### ⏹ Phase 11: Analytics
- [ ] Implement `AnalyticsRepository` fetching cost-to-feed, production forecasting, and profit margins

### ⏹ Phase 12: AI Integration (GauGuru)
- [ ] Build Chat screens and voice assistance orchestrating the structured feature module APIs
