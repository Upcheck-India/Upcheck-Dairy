import { Controller, Get, Post, Put, Delete, Body, Param, Inject, UseInterceptors, UploadedFile } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { FarmsService } from "../services/farms.service";
import { Public, GetUser } from "../../common/decorators/auth.decorators";
import { CreateFarmDto } from "../dto/create-farm.dto";
import { UpdateFarmDto } from "../dto/update-farm.dto";
import { UserRepository } from "../../auth/repositories/user.repository";
import type { Farmer } from "@workspace/db";

@Controller("farms")
export class FarmsController {
  constructor(@Inject(FarmsService) private readonly farmsService: FarmsService) {}

  @Post()
  async create(@GetUser() user: Farmer, @Body() body: CreateFarmDto) {
    return this.farmsService.createFarm(user.id, body.name, body.location);
  }

  @Get()
  async getMyFarms(@GetUser() user: Farmer) {
    return this.farmsService.getFarmsByOwner(user.id);
  }

  @Get(":id")
  async getById(@Param("id") id: string) {
    return this.farmsService.getFarmById(id);
  }

  @Put(":id")
  async update(@Param("id") id: string, @Body() body: UpdateFarmDto) {
    return this.farmsService.updateFarm(id, body);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.farmsService.deleteFarm(id);
    return { success: true };
  }
}

@Controller("farm")
export class LegacyFarmController {
  constructor(
    @Inject(FarmsService) private readonly farmsService: FarmsService,
    @Inject(UserRepository) private readonly userRepository: UserRepository
  ) {}

  @Get("profile")
  async getProfile(@GetUser() user: Farmer) {
    return user;
  }

  @Post("profile")
  async createOrUpdateProfile(@GetUser() user: Farmer, @Body() body: Partial<Farmer>) {
    const updates: Partial<Farmer> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.farmName !== undefined) updates.farmName = body.farmName;
    if (body.village !== undefined) updates.village = body.village;
    if (body.district !== undefined) updates.district = body.district;
    if (body.avatarInitials !== undefined) updates.avatarInitials = body.avatarInitials;
    if (body.state !== undefined) updates.state = body.state;
    if (body.pincode !== undefined) updates.pincode = body.pincode;
    if (body.onboardingCompleted !== undefined) updates.onboardingCompleted = body.onboardingCompleted;
    if (body.locationPermission !== undefined) updates.locationPermission = body.locationPermission;
    if (body.notificationsEnabled !== undefined) updates.notificationPermission = body.notificationsEnabled;
    if (body.notificationPermission !== undefined) updates.notificationPermission = body.notificationPermission;

    return this.userRepository.update(user.id, updates);
  }

  @Public()
  @Post("diagnose")
  async diagnose(
    @Body() body: { symptoms: string[]; customNote?: string; animalName?: string; animalType?: string },
  ) {
    return this.farmsService.diagnose(body.symptoms, body.customNote, body.animalName, body.animalType);
  }

  @Public()
  @Post("voice-command")
  async voiceCommand(
    @Body() body: { transcript: string; animals?: Array<{ id: string; name: string; type: string }> },
  ) {
    return this.farmsService.parseVoiceCommand(body.transcript, body.animals);
  }

  @Public()
  @Post("transcribe")
  @UseInterceptors(FileInterceptor("audio"))
  async transcribe(@UploadedFile() file: Express.Multer.File) {
    return this.farmsService.transcribeAudio(file);
  }

  @Public()
  @Post("chat")
  async chat(
    @Body() body: { message: string; history?: Array<{ role: "user" | "assistant"; content: string }>; language?: string },
  ) {
    return this.farmsService.chat(body.message, body.history, body.language);
  }

  @Public()
  @Post("ration")
  async ration(
    @Body() body: { animalType: string; breed: string; weightKg: number; milkProductionL: number; language?: string },
  ) {
    return this.farmsService.calculateRation(body.animalType, body.breed, body.weightKg, body.milkProductionL, body.language);
  }
}
