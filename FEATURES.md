# UpCheck Dairy — Platform Features Directory

UpCheck Dairy is a comprehensive, production-grade dairy farm management platform. It features an Expo React Native mobile application (**ThulirFarm**) and a NestJS/Express API backend using Drizzle ORM and PostgreSQL.

Below is a detailed directory of the features currently implemented, in progress, or planned for the platform.

---

## 📋 Core Feature Modules

### 🔐 1. Authentication & Session Management (`auth` module)
* **User Accounts**: Registration and secure login for farm owners, managers, and operators.
* **Role-Based Access**: Permission-controlled access levels (Farmer, Administrator, etc.).
* **Session Persistence**: JWT-token based secure session management on the mobile client.
* **Onboarding Flow**: Language selection, user profile creation, and initial farm setup.

### 🚜 2. Farm Management (`farms` module)
* **Multi-Farm Context**: Support for farmers managing multiple farm locations.
* **Farm Registry**: Records farm name, location, and owner metadata.
* **Active Farm Context**: A global frontend selector (`FarmSelector` bottom sheet) that filters all other dashboard metrics, animals, and logs according to the selected farm context.

### 🐄 3. Herd Management (`animals` module)
* **Animal Profiles**: Individual digital identity cards containing:
  * Tag number / Ear tag ID
  * Breed details (e.g., Holstein-Friesian, Jersey, Gir)
  * Age and birth records
  * Lifecycle stages (Heifer, Lactating, Dry cow, Calf)
* **Physical Metrics Tracking**: Logs historical Weight and Body Condition Score (BCS).
* **Herd Timeline**: Unified timeline displaying health events, breeding stages, and vaccinations for each individual cow.

### 🥛 4. Milk Production Management (`milk` module)
* **Session-Scoped Logs**: Ability to log milk collection yields for morning (AM) and evening (PM) sessions.
* **Quality Metrics**: Input fields for key milk quality parameters:
  * Quantity (liters)
  * Fat percentage (%)
  * Solid-Not-Fat (SNF) percentage (%)
* **Timezone-Aware Date Bucketing**: Records are aligned strictly with Indian Standard Time (IST) to ensure consistency in daily summaries.
* **Pricing Engine (NDDB Model)**: Formulaic payout calculations based on fat and SNF percentages (referencing standard pricing tables).

### 🏥 5. Health & Veterinary Care (`health` module)
* **Disease & Symptom Registry**: Logs illness diagnoses, onset dates, and symptom history.
* **Treatment Tracking**: Logs administered veterinary medications, dosages, treatment duration, and withdrawal periods.
* **Vaccination Scheduler**: Tracks completed and scheduled vaccinations (e.g., FMD, Brucellosis) with target dates and batch numbers.

### 🧬 6. Breeding & Reproduction (`breeding` module)
* **Heat Cycle Monitoring**: Records heat detection dates and warns of upcoming cycles.
* **Insemination Records**: Tracks Artificial Insemination (AI) or natural service dates, bull details, and operator names.
* **Pregnancy Diagnoses**: Logs pregnancy confirmation checks (PD dates, results).
* **Calving History**: Records gestation outcomes, calving dates, calf gender, and delivery conditions.

### 📦 7. Inventory & Supply Chain (`inventory` module)
* **Feed Management**: Tracks feed stock levels, consumption rates, and purchase costs.
* **Veterinary Pharmacy**: Monitors medicine stocks, expiry dates, and usage.
* **Supplies & Equipment**: Tracks general farm tools, sanitation items, and dairy consumables.

### 📅 8. Daily Tasks & Reminders (`tasks` module)
* **Routines**: Manages daily farm checklists (milking times, feeding times, cleaning schedules).
* **Veterinary Reminders**: Alerts for upcoming booster doses, health checks, and dry-off dates.
* **Breeding Alerts**: Dynamic reminders for pregnancy confirmation (PD) or expected calving dates.

### 💰 9. Financial Management (`finance` module)
* **Income Tracker**: Logs milk sales revenue and auxiliary farm income.
* **Expense Tracker**: Logs operational expenditures categorized by Feed, Medicine, Labor, and Equipment.
* **Payment Reconciliation**: Compares expected payouts (based on quality/quantity logs) against actual receipts from buyers or milk cooperatives.
* **Historical Cashflow**: View-only ledger of historical revenue.

---

## 🎨 Dashboards & Workspaces

### 📊 1. Core Dashboard
* **KPI Metrics**: Real-time cards displaying daily milk totals, active milking herd count, and today's financial summary.
* **Milk Production Chart**: Interactive 7-day visual line chart illustrating yield trends.
* **Reconciliation Banner**: Summarizes outstanding milk payments vs. paid statements.

### 🤝 2. Herd Workspace
* **Group Management**: Filter herds by lactation stage, pregnancy status, or group assignments.
* **Timeline Integration**: Dynamic chronological view of breeding events, upcoming vaccinations, and treatment schedules.

### 💬 3. GauGuru AI Voice Assistant
* **Voice Transcription**: Micro-interaction that transcribes user voice logs into database entries.
* **Multilingual Chatbot**: Contextual chat screen powered by AI (OpenAI integrations) to answer general dairy farming questions.
* **Voice Diagnostics**: Conversational veterinary diagnostics input (primarily optimized for Tamil language).

---

## 🛠 Tech Stack & Architectural Highlights

### Frontend (`frontend/`)
* **Framework**: React Native with Expo.
* **Styling**: Vanilla CSS stylesheets and TailwindCSS.
* **State Management**: React Context Provider pattern with module-scoped hooks (`useAnimals`, `useMilk`, `useFarm`, etc.).
* **Localization**: Integrated translation engine mapping strings across regional languages (Tamil, Kannada, etc.).

### Backend (`backend/`)
* **Framework**: NestJS & Express API.
* **Database**: PostgreSQL with Drizzle ORM.
* **Cache Layer**: Redis for session tokens, analytics cache, and notifications.
* **Validation**: Class-validator with decorators enforcing structural integrity on HTTP requests.

---

## 🗺 Feature Roadmap Status

| Feature / System | Status | Priority |
| :--- | :---: | :--- |
| **Herd Management** | ✅ Implemented | High |
| **Timezone-Correct Milk Logging** | ✅ Implemented | High |
| **Breeding & Reproduction Records** | ✅ Implemented | High |
| **Financial Ledger / Reconciliations** | ✅ Implemented | High |
| **Dashboard Workspace Composition** | ✅ Implemented | Medium |
| **Offline Writes Queue** | ⚙️ In Progress | Critical (Phase 12) |
| **Push Reminders & Local Notifications**| ⏹ Planned | Medium (Phase 13) |
| **Cost-to-feed & Yield Forecasting** | ⏹ Planned | Medium (Phase 14) |
| **PDF & Excel Reports Export** | ⏹ Planned | Low (Phase 15) |
| **GauGuru AI Farm-Data Grounding** | ⏹ Planned | Low (Phase 16) |
