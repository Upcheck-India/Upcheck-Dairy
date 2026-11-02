import * as dotenv from "dotenv";
dotenv.config();

import { AnimalsRepository } from "./src/animals/repositories/animals.repository.js";
import { DatabaseService } from "./src/database/database.service.js";

async function run() {
  const dbService = new DatabaseService();
  const repo = new AnimalsRepository(dbService);
  
  const farmId = "8dea79d6-a9c8-4ac0-829f-ce53ca066055";
  console.log(`Running repo.findByFarmWithLatestMilk for farmId: ${farmId}...`);
  
  const rows = await repo.findByFarmWithLatestMilk(farmId);
  console.log("Result rows:");
  console.log(JSON.stringify(rows.map(r => ({
    id: r.id,
    name: r.name,
    tagNumber: r.tagNumber,
    lastMilkEntry: r.lastMilkEntry
  })), null, 2));
}

run().catch(console.error);
