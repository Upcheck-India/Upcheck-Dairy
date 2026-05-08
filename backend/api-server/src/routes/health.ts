import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { sql } from "drizzle-orm";
import { db } from "../lib/db";

const router: IRouter = Router();

router.get("/healthz", async (_req, res) => {
  try {
    // Check DB connection
    await db.execute(sql`SELECT 1`);
    const data = HealthCheckResponse.parse({ status: "ok" });
    res.json({ ...data, database: "connected" });
  } catch (err) {
    res.status(503).json({ status: "error", database: "disconnected", error: (err as Error).message });
  }
});

export default router;
