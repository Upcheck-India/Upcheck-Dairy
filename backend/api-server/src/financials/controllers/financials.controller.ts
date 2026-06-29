import { Controller, Get, Post, Delete, Body, Param, Inject, Headers } from "@nestjs/common";
import { FinancialsService } from "../services/financials.service";
import { CreateIncomeEntryDto } from "../dto/create-income-entry.dto";
import { CreateExpenseEntryDto } from "../dto/create-expense-entry.dto";
import { GetUser } from "../../common/decorators/auth.decorators";
import type { Farmer } from "@workspace/db";

@Controller("financials")
export class FinancialsController {
  constructor(@Inject(FinancialsService) private readonly financialsService: FinancialsService) {}

  // ── Income ────────────────────────────────────────────────────────────────

  @Get("income")
  async getIncome(@GetUser() user: Farmer, @Headers("x-farm-id") farmId: string) {
    return this.financialsService.getIncomeEntries(user.id, farmId);
  }

  @Post("income")
  async createIncome(@GetUser() user: Farmer, @Body() dto: CreateIncomeEntryDto) {
    return this.financialsService.createIncomeEntry(user.id, dto);
  }

  @Delete("income/:id")
  async deleteIncome(@GetUser() user: Farmer, @Param("id") id: string) {
    await this.financialsService.deleteIncomeEntry(user.id, Number(id));
    return { success: true };
  }

  // ── Expenses ──────────────────────────────────────────────────────────────

  @Get("expenses")
  async getExpenses(@GetUser() user: Farmer, @Headers("x-farm-id") farmId: string) {
    return this.financialsService.getExpenseEntries(user.id, farmId);
  }

  @Post("expenses")
  async createExpense(@GetUser() user: Farmer, @Body() dto: CreateExpenseEntryDto) {
    return this.financialsService.createExpenseEntry(user.id, dto);
  }

  @Delete("expenses/:id")
  async deleteExpense(@GetUser() user: Farmer, @Param("id") id: string) {
    await this.financialsService.deleteExpenseEntry(user.id, Number(id));
    return { success: true };
  }
}
