import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import multer from "multer";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const upload = multer({ dest: os.tmpdir() });

const router: IRouter = Router();

router.post("/farm/diagnose", async (req, res) => {
  try {
    const { symptoms, customNote, animalName, animalType } = req.body as {
      symptoms: string[];
      customNote?: string;
      animalName?: string;
      animalType?: string;
    };

    if (!symptoms || symptoms.length === 0) {
      res.status(400).json({ error: "At least one symptom is required" });
      return;
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

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    });

    const rawContent = completion.choices[0]?.message?.content ?? "{}";

    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      parsed = {
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

    res.json(parsed);
  } catch (err) {
    console.error("Diagnose error:", err);
    res.status(500).json({ error: "Diagnosis failed" });
  }
});

router.post("/farm/voice-command", async (req, res) => {
  try {
    const { transcript, animals } = req.body as {
      transcript: string;
      animals?: Array<{ id: string; name: string; type: string }>;
    };

    if (!transcript) {
      res.status(400).json({ error: "Transcript is required" });
      return;
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

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    });

    const rawContent = completion.choices[0]?.message?.content ?? "{}";

    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      parsed = {
        action: "unknown",
        confidence: 0,
        params: {},
        confirmationText: "Command not understood",
        confirmationTamil: "கட்டளை புரியவில்லை",
      };
    }

    res.json(parsed);
  } catch (err) {
    console.error("Voice command error:", err);
    res.status(500).json({ error: "Voice command parsing failed" });
  }
});

router.post("/farm/transcribe", (upload as any).single("audio"), async (req: any, res: any) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: "No audio file provided" });
    return;
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

    res.json({ transcript: transcription.text });
  } catch (err) {
    console.error("Transcription error:", err);
    res.status(500).json({ error: "Transcription failed" });
  } finally {
    try { fs.unlinkSync(destPath); } catch { /* ignore */ }
  }
});

export default router;
