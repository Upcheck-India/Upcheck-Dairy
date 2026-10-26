import { Controller, Get, Post, Delete, Body, Param, Inject, Headers, ParseIntPipe, UseInterceptors, UploadedFile, BadRequestException } from "@nestjs/common";
import { FinancialsService } from "../services/financials.service";
import { CreateIncomeEntryDto } from "../dto/create-income-entry.dto";
import { CreateExpenseEntryDto } from "../dto/create-expense-entry.dto";
import { GetUser } from "../../common/decorators/auth.decorators";
import type { PublicFarmer } from "../../common/public-farmer";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { randomBytes } from "node:crypto";
import { extname } from "path";

@Controller("financials")
export class FinancialsController {
  constructor(@Inject(FinancialsService) private readonly financialsService: FinancialsService) {}

  @Get("overview")
  async getOverview(@GetUser() user: PublicFarmer, @Headers("x-farm-id") farmId: string) {
    return this.financialsService.getOverview(user.id, farmId);
  }

  @Get("passbook")
  async getPassbook(@GetUser() user: PublicFarmer, @Headers("x-farm-id") farmId: string) {
    return this.financialsService.getPassbookEntries(user.id, farmId);
  }

  @Post("upload")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: "./uploads",
        filename: (req, file, cb) => {
          // crypto, not Math.random: /uploads is served statically with no auth,
          // so a guessable filename exposes another farm's photos.
          const uniqueSuffix = Date.now() + "-" + randomBytes(8).toString("hex");
          cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(pdf|png|jpeg|jpg|webp)$/)) {
          cb(new BadRequestException("Unsupported file type"), false);
        } else {
          cb(null, true);
        }
      },
    })
  )
  async uploadFinanceAttachment(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("File is required");
    }
    return { url: `/uploads/${file.filename}`, filename: file.originalname };
  }

  // ── Income ────────────────────────────────────────────────────────────────

  @Get("income")
  async getIncome(@GetUser() user: PublicFarmer, @Headers("x-farm-id") farmId: string) {
    return this.financialsService.getIncomeEntries(user.id, farmId);
  }

  @Post("income")
  async createIncome(@GetUser() user: PublicFarmer, @Body() dto: CreateIncomeEntryDto) {
    return this.financialsService.createIncomeEntry(user.id, dto);
  }

  @Delete("income/:id")
  async deleteIncome(@GetUser() user: PublicFarmer, @Param("id", ParseIntPipe) id: number) {
    await this.financialsService.deleteIncomeEntry(user.id, id);
    return { success: true };
  }

  // ── Expenses ──────────────────────────────────────────────────────────────

  @Get("expenses")
  async getExpenses(@GetUser() user: PublicFarmer, @Headers("x-farm-id") farmId: string) {
    return this.financialsService.getExpenseEntries(user.id, farmId);
  }

  @Post("expenses")
  async createExpense(@GetUser() user: PublicFarmer, @Body() dto: CreateExpenseEntryDto) {
    return this.financialsService.createExpenseEntry(user.id, dto);
  }

  @Delete("expenses/:id")
  async deleteExpense(@GetUser() user: PublicFarmer, @Param("id", ParseIntPipe) id: number) {
    await this.financialsService.deleteExpenseEntry(user.id, id);
    return { success: true };
  }
}
