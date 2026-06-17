import { Controller, Get, Post, Body, UseInterceptors, UploadedFile, Inject } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { FarmService } from "./farm.service";
import { Public } from "../auth/decorators/auth.decorators";

@Controller("farm")
export class FarmController {
  constructor(@Inject(FarmService) private readonly farmService: FarmService) {}

  @Public()
  @Post("diagnose")
  async diagnose(
    @Body() body: { symptoms: string[]; customNote?: string; animalName?: string; animalType?: string },
  ) {
    return this.farmService.diagnose(body.symptoms, body.customNote, body.animalName, body.animalType);
  }

  @Public()
  @Post("voice-command")
  async voiceCommand(
    @Body() body: { transcript: string; animals?: Array<{ id: string; name: string; type: string }> },
  ) {
    return this.farmService.parseVoiceCommand(body.transcript, body.animals);
  }

  @Public()
  @Post("transcribe")
  @UseInterceptors(FileInterceptor("audio"))
  async transcribe(@UploadedFile() file: Express.Multer.File) {
    return this.farmService.transcribeAudio(file);
  }

  @Public()
  @Post("chat")
  async chat(
    @Body() body: { message: string; history?: Array<{ role: "user" | "assistant"; content: string }>; language?: string },
  ) {
    return this.farmService.chat(body.message, body.history, body.language);
  }

  @Public()
  @Post("ration")
  async ration(
    @Body() body: { animalType: string; breed: string; weightKg: number; milkProductionL: number; language?: string },
  ) {
    return this.farmService.calculateRation(body.animalType, body.breed, body.weightKg, body.milkProductionL, body.language);
  }
}

// Simple health controller to handle GET /api/health
@Controller()
export class HealthController {
  @Public()
  @Get("health")
  getHealth() {
    return { status: "ok" };
  }
}
