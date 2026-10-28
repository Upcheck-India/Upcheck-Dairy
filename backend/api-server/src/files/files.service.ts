import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { animals, farms, incomeEntries, expenseEntries } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import * as path from "node:path";
import * as fs from "node:fs";

/** Filenames multer produces: `<field>-<ms>-<16 hex>.<ext>`, nothing else. */
const SAFE_FILENAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,120}$/;

@Injectable()
export class FilesService {
  private readonly uploadsDir = path.join(process.cwd(), "uploads");

  constructor(@Inject(DatabaseService) private dbService: DatabaseService) {}

  /**
   * Resolve an uploaded file for a caller, or throw.
   *
   * Authentication alone is not enough here: every farmer could otherwise read
   * every other farmer's photos and receipts. A file is only readable by the
   * owner of the farm whose record references it, so access is derived from
   * the referencing row rather than from possession of the filename.
   *
   * A file nothing references is unreachable by anyone — orphans left behind
   * by a failed save stay private.
   */
  async resolveForUser(userId: string, filename: string): Promise<{ absolutePath: string }> {
    // Reject anything that is not a plain filename before it reaches the disk.
    // `..` and separators cannot match SAFE_FILENAME, so traversal is blocked
    // here; the containment check below is a second line of defence.
    if (!SAFE_FILENAME.test(filename) || filename.includes("..")) {
      throw new NotFoundException("File not found");
    }

    const storedPath = `/uploads/${filename}`;
    const owned = await this.isReferencedByUser(userId, storedPath);
    if (!owned) {
      // Deliberately the same error as a missing file: a caller must not be
      // able to probe which filenames exist on someone else's farm.
      throw new NotFoundException("File not found");
    }

    const absolutePath = path.resolve(this.uploadsDir, filename);
    if (!absolutePath.startsWith(path.resolve(this.uploadsDir) + path.sep)) {
      throw new NotFoundException("File not found");
    }
    if (!fs.existsSync(absolutePath)) {
      throw new NotFoundException("File not found");
    }

    return { absolutePath };
  }

  /** True when a record on one of the caller's farms points at this path. */
  private async isReferencedByUser(userId: string, storedPath: string): Promise<boolean> {
    const db = this.dbService.drizzle;

    const animalHit = await db
      .select({ id: animals.id })
      .from(animals)
      .innerJoin(farms, eq(animals.farmId, farms.id))
      .where(and(eq(animals.photoUri, storedPath), eq(farms.ownerFarmerId, userId)))
      .limit(1);
    if (animalHit.length > 0) return true;

    const incomeHit = await db
      .select({ id: incomeEntries.id })
      .from(incomeEntries)
      .innerJoin(farms, eq(incomeEntries.farmId, farms.id))
      .where(and(eq(incomeEntries.attachmentUrl, storedPath), eq(farms.ownerFarmerId, userId)))
      .limit(1);
    if (incomeHit.length > 0) return true;

    const expenseHit = await db
      .select({ id: expenseEntries.id })
      .from(expenseEntries)
      .innerJoin(farms, eq(expenseEntries.farmId, farms.id))
      .where(and(eq(expenseEntries.attachmentUrl, storedPath), eq(farms.ownerFarmerId, userId)))
      .limit(1);
    return expenseHit.length > 0;
  }
}
