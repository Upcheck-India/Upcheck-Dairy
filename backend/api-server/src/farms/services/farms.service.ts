import { Injectable, BadRequestException, InternalServerErrorException, Inject } from "@nestjs/common";
import { FarmsRepository } from "../repositories/farms.repository";
import { openai } from "@workspace/openai-server";
import { type Farm, type InsertFarm } from "@workspace/db";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

@Injectable()
export class FarmsService {
  constructor(
    @Inject(FarmsRepository) private farmsRepository: FarmsRepository
  ) {}

  // ==================== Farms CRUD ====================

  async createFarm(ownerFarmerId: string, name: string, location?: string): Promise<Farm> {
    if (!name) {
      throw new BadRequestException("Farm name is required");
    }
    const id = crypto.randomUUID();
    return this.farmsRepository.create({
      id,
      ownerFarmerId,
      name,
      location: location || null,
    });
  }

  async getFarmById(id: string): Promise<Farm | null> {
    return this.farmsRepository.findById(id);
  }

  async getFarmsByOwner(ownerFarmerId: string): Promise<Farm[]> {
    return this.farmsRepository.findByOwner(ownerFarmerId);
  }

  async updateFarm(id: string, data: Partial<Farm>): Promise<Farm> {
    return this.farmsRepository.update(id, data);
  }

  async deleteFarm(id: string): Promise<void> {
    await this.farmsRepository.delete(id);
  }

  // ==================== Legacy AI logic ====================

  async diagnose(symptoms: string[], customNote?: string, animalName?: string, animalType?: string) {
    if (!symptoms || symptoms.length === 0) {
      throw new BadRequestException("At least one symptom is required");
    }

    const animalDesc = animalName
      ? `${animalType ?? "cow"} named "${animalName}"`
      : `a ${animalType ?? "cow"}`;

    const prompt = `You are an expert veterinarian specializing in Indian dairy cattle (cows and buffaloes). A Tamil Nadu dairy farmer reports the following about ${animalDesc}:

Symptoms: ${symptoms.join(", ")}
${customNote ? `Additional notes: ${customNote}` : ""}

Provide a structured diagnosis response as JSON with these exact fields:
{
  "summary": "Brief 1-sentence summary in English",
  "summaryTamil": "Same summary in Tamil",
  "possibleCauses": ["cause 1", "cause 2", "cause 3"],
  "immediateActions": ["action 1", "action 2", "action 3"],
  "riskLevel": "low|medium|high|critical",
  "medicine": "Suggested medicine with dosage, or null if none",
  "tamilAdvice": "Detailed advice paragraph in Tamil that the farmer can understand (use simple Tamil, not medical jargon)",
  "homeRemedy": "Simple home remedy if applicable, or null",
  "nextSteps": "What to do if no improvement in 6-12 hours",
  "callVetImmediately": true or false
}

Respond with ONLY the JSON object, no markdown code blocks.`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        max_completion_tokens: 8192,
        messages: [{ role: "user", content: prompt }],
      });

      const rawContent = completion.choices[0]?.message?.content ?? "{}";
      return JSON.parse(rawContent);
    } catch (err) {
      console.error("Diagnose error:", err);
      return {
        summary: "Unable to process diagnosis",
        summaryTamil: "நோயறிதல் செயல்படவில்லை",
        possibleCauses: ["Unable to determine"],
        immediateActions: ["Please contact your veterinarian"],
        riskLevel: "medium",
        medicine: null,
        tamilAdvice: "மருத்துவரை அழைக்கவும்",
        homeRemedy: null,
        nextSteps: "Call veterinarian if no improvement",
        callVetImmediately: false,
      };
    }
  }

  async parseVoiceCommand(transcript: string, animals?: Array<{ id: string; name: string; type: string }>) {
    if (!transcript) {
      throw new BadRequestException("Transcript is required");
    }

    const animalList = animals?.map((a) => `${a.name} (${a.type}, id: ${a.id})`).join(", ") ?? "none";

    const prompt = `You are a voice command parser for a Tamil dairy farm app. Parse the following voice command (may be in Tamil or English) and return a structured action.

Voice command: "${transcript}"
Available animals: ${animalList}

Return JSON with exactly this structure:
{
  "action": "log_milk|report_problem|add_expense|navigate|unknown",
  "confidence": 0.0 to 1.0,
  "params": {
    "animalId": "animal id if milk or problem, or null",
    "animalName": "animal name if mentioned, or null",
    "quantity": number if milk logging, or null,
    "session": "morning|evening|null",
    "symptom": "fever|notEating|lessMilk|limping|diarrhea|bloating|coughing|injury|inHeat or null",
    "expenseCategory": "feed|medicine|labor|equipment|other or null",
    "expenseAmount": number or null,
    "expenseDescription": "description or null",
    "tab": "animals|help|money|today or null"
  },
  "confirmationText": "Short confirmation in English e.g. 'Log 5L morning for Lakshmi'",
  "confirmationTamil": "Same in Tamil"
}

For milk commands like 'Lakshmi 5 litre morning' or 'லக்ஷ்மி 5 இலிட்டர் காலை', set action to log_milk.
For problem commands like 'cow not eating' or 'ராணி காய்ச்சல்', set action to report_problem.
For expense commands like 'feed expense 500', set action to add_expense.
For navigation like 'show animals' or 'go to money', set action to navigate.
Respond with ONLY the JSON object.`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        max_completion_tokens: 8192,
        messages: [{ role: "user", content: prompt }],
      });

      const rawContent = completion.choices[0]?.message?.content ?? "{}";
      return JSON.parse(rawContent);
    } catch (err) {
      console.error("Voice command error:", err);
      return {
        action: "unknown",
        confidence: 0,
        params: {},
        confirmationText: "Command not understood",
        confirmationTamil: "கட்டளை புரியவில்லை",
      };
    }
  }

  async transcribeAudio(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("No audio file provided");
    }

    const MAX_FILE_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException("Audio file too large. Maximum size is 25MB.");
    }

    const ext = file.mimetype?.includes("mp4") ? ".m4a" : ".wav";
    const destPath = path.join(os.tmpdir(), file.filename + ext);

    try {
      fs.renameSync(file.path, destPath);

      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(destPath),
        model: "whisper-1",
        language: "ta",
        prompt: "Tamil dairy farm commands about cows, milk, feed, expenses",
      });

      return { transcript: transcription.text };
    } catch (err) {
      console.error("Transcription error:", err);
      throw new InternalServerErrorException("Transcription failed");
    } finally {
      try {
        fs.unlinkSync(destPath);
      } catch {
        // ignore
      }
    }
  }

  async chat(message: string, history?: Array<{ role: "user" | "assistant"; content: string }>, language?: string) {
    if (!message) {
      throw new BadRequestException("Message is required");
    }

    const langMap: Record<string, string> = {
      ta: "Tamil (simple, conversational, easily understood by rural farmers)",
      te: "Telugu (simple, conversational)",
      kn: "Kannada (simple, conversational)",
      ml: "Malayalam (simple, conversational)",
      hi: "Hindi (Hindustani style, simple for rural farmers)",
      en: "English",
    };
    const langInstruction = langMap[language ?? "ta"] ?? langMap.ta!;

    const systemPrompt = `You are GauGuru (கோ குரு / கவுகுரு), an expert AI assistant for Indian dairy farmers. You provide practical, actionable advice.

You are an expert in:
- Indian dairy breeds: HF, Jersey, Gir, Sahiwal, Tharparkar, Kangayam, Umblachery, Bargur, Murrah buffalo, Surti, Mehsana, Jaffarabadi
- South Indian dairy farming (Tamil Nadu, Andhra Pradesh, Karnataka, Kerala)
- Common cattle diseases: FMD, HS, BQ, Mastitis, Milk Fever, Bloat, Tick Fever, Theileriosis
- AI insemination (artificial insemination), semen selection, heat detection (21-day cycle, signs of heat)
- Breeding: gestation period (280 days cow, 310 days buffalo), calving care
- Nutrition: TMR, green fodder (napier, maize, sorghum), concentrate feed, mineral mix, bypass protein
- Milk quality: FAT%, SNF%, SNF standards (cow min 8.5%, buffalo min 9%)
- Government schemes: AHIDF, NDP-II, Kisan Credit Card for dairy, PM-KUSUM, NABARD loans
- Milk pricing: MSP, cooperative pricing, private dairy rates
- Vaccination schedule: FMD every 6 months, HS annually, BQ annually for calves, Brucellosis once for heifers

Always respond in ${langInstruction}.
Keep answers CONCISE (3-5 sentences max).
Use simple language a village farmer can understand.
Add practical local context when possible.
Never give medicine dosages.`;

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...(history ?? [])
        .filter((h): h is { role: "user" | "assistant"; content: string } =>
          h && typeof h.content === "string" && (h.role === "user" || h.role === "assistant")
        )
        .slice(-8),
      { role: "user" as const, content: message },
    ];

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 400,
        temperature: 0.7,
      });

      const response = completion.choices[0]?.message?.content ?? "Sorry, I couldn't answer that.";
      return { response };
    } catch (err) {
      console.error("Chat error:", err);
      return { response: "Sorry, there was an error. Please try again." };
    }
  }

  async calculateRation(animalType: string, breed: string, weightKg: number, milkProductionL: number, language?: string) {
    if (!animalType || !breed || typeof weightKg !== "number" || typeof milkProductionL !== "number") {
      throw new BadRequestException("animalType, breed, weightKg, and milkProductionL are required");
    }

    const langMap: Record<string, string> = {
      ta: "Tamil", te: "Telugu", kn: "Kannada", ml: "Malayalam", hi: "Hindi", en: "English",
    };
    const langInstruction = langMap[language ?? "ta"] ?? "Tamil";

    const prompt = `You are a dairy nutrition expert for Indian farmers.
Calculate a daily ration for: ${animalType} (${breed}), weight: ${weightKg} kg, milk production: ${milkProductionL} L/day.

Provide a practical feeding recommendation as JSON:
{
  "summary": "1-sentence summary in English",
  "summaryLocal": "Same summary in ${langInstruction}",
  "greenFodder": {"quantity": "25-30 kg", "examples": "Napier grass, Maize"},
  "dryFodder": {"quantity": "5-6 kg", "examples": "Paddy straw, Sugarcane bagasse"},
  "concentrate": {"quantity": "X kg", "composition": "Broken rice, groundnut cake, mineral mix"},
  "mineralMix": "50-100 g/day",
  "water": "40-60 litres/day",
  "totalCost": "Estimated Rs. X-Y per day",
  "tips": ["Tip 1 in ${langInstruction}", "Tip 2 in ${langInstruction}"]
}

Base formula: Maintenance = bodyweight × 0.015 kg DM; Production = 0.35 kg concentrate per extra litre above 4L.
Respond ONLY with valid JSON.`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0]?.message?.content ?? "{}";
      return JSON.parse(content);
    } catch (err) {
      console.error("Ration error:", err);
      throw new InternalServerErrorException("Ration calculation failed");
    }
  }
}
