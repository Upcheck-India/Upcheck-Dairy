import { Injectable } from "@nestjs/common";
import { db } from "@workspace/db";

@Injectable()
export class DatabaseService {
  public readonly drizzle = db;
}
