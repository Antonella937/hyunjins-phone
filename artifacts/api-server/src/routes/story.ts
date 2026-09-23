import { Router, type IRouter } from "express";
import OpenAI from "openai";
import { loadVoiceAudio, saveVoiceAudio, normalizeWav } from "../lib/voiceAudioStorage";
import {
  GenerateStoryActivityBody,
  GenerateStoryActivityResponse,
  GenerateStoryImageBody,
  GenerateStoryImageResponse,
  GetStoryProvidersResponse,
  GenerateVoiceTranscriptBody,
  GenerateVoiceTranscriptResponse,
  GenerateVoiceAudioBody,
  GenerateVoiceAudioResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const baseUrl = process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"]?.replace(/\/$/, "");
const apiKey = process.env["AI_INTEGRATIONS_OPENAI_API_KEY"];

function providerReady() {
  return Boolean(baseUrl && apiKey);
}

function parseJsonObject(value: string): unknown {
  const cleaned = value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  return JSON.parse(cleaned);
}

router.get("/story/providers", (_req, res) => {
  const connected = providerReady();
  res.json(
    GetStoryProvidersResponse.parse({
      text: { connected, label: connected ? "Replit OpenAI" : "Not connected" },
      image: { connected, label: connected ? "Replit OpenAI Images" : "Not connected" },
      music: { connected: false, label: "Not connected" },
      audio: { connected: providerReady() && Boolean(process.env.PRIVATE_OBJECT_DIR), label: providerReady() && process.env.PRIVATE_OBJECT_DIR ? "Audio AI Connected" : "Audio AI Provider Not Connected" },
    }),
  );
});

router.post("/story/generate", async (req, res) => {
  const input = GenerateStoryActivityBody.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: "Please provide a valid story update." });
    return;
  }
  if (!baseUrl || !apiKey) {
    res.status(503).json({ error: "Text AI provider is not connected." });
    return;
  }

  const safetyRule =
    input.data.mode === "generate_day"
      ? "You may invent only small mundane connective details. Never invent travel, death, pregnancy, marriage, breakup, major fights, career changes, relationship changes, or important confessions unless explicitly present."
      : "Do not invent major canon events or the contents of important conversations that were not provided.";

  const system = `You generate fictional roleplay smartphone activity for a character named Hyunjin. Everything is fictional. Return strict JSON only.

User-written canon always overrides generated material. Never contradict canon. ${safetyRule}
Hyunjin must feel like a whole person: balance romantic life with friends, art, music, work, Seoul, humor, routines, and private observations.
Generate only the few app traces that logically follow. Do not create something for every app.
Only propose a Voice Memo when the update naturally suggests something he would record privately. For app "voice", put the transcript in "content" and metadata with "language" (English, Korean, or Mixed), "context", "delivery", "category", and optional "relatedEvent". Include the date and time in "timestamp". Do not generate audio here.

Return:
{
  "summary": "one sentence",
  "proposals": [
    {
      "id": "unique-kebab-id",
       "app": "messages|instagram|echo|gallery|diary|notes|quickNotes|voice|music|studio|calendar|browser|calls|notifications|files|places|contacts",
      "type": "short subtype",
      "title": "short review title",
      "content": "the realistic fictional content",
      "timestamp": "human readable time",
      "person": "name or null",
      "metadata": {}
    }
  ]
}

For a contact card use app "contacts", title as the person's name, content as their context, and metadata with "role" and optionally "color". Never use "messages" for a new contact.
Keep proposals concise and reviewable. For calls, record only that a call occurred unless conversation content was explicitly supplied.`;

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5.6-terra",
        max_completion_tokens: 8192,
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: JSON.stringify({
              storyUpdate: input.data.storyUpdate,
              canon: input.data.canon,
              existingPhone: input.data.existingPhone,
            }),
          },
        ],
      }),
    });
    if (!response.ok) {
      req.log.error({ status: response.status }, "Story generation provider failed");
      res.status(503).json({ error: "Story generation is temporarily unavailable." });
      return;
    }
    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("Provider returned no story content");
    res.json(GenerateStoryActivityResponse.parse(parseJsonObject(content)));
  } catch (error) {
    req.log.error({ err: error }, "Unable to generate story activity");
    res.status(503).json({ error: "The proposed activity could not be generated." });
  }
});

router.post("/story/image", async (req, res) => {
  const input = GenerateStoryImageBody.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: "Please provide a valid image prompt." });
    return;
  }
  if (!baseUrl || !apiKey) {
    res.status(503).json({ error: "Image provider is not connected." });
    return;
  }

  try {
    const response = await fetch(`${baseUrl}/images/generations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        size: "1024x1024",
        quality: "low",
        output_format: "webp",
        prompt: `Believable casual smartphone photo for a fictional roleplay timeline. Natural, imperfect, not promotional. ${input.data.prompt}`,
      }),
    });
    if (!response.ok) {
      req.log.error({ status: response.status }, "Image generation provider failed");
      res.status(503).json({ error: "Image generation is temporarily unavailable." });
      return;
    }
    const payload = (await response.json()) as { data?: Array<{ b64_json?: string }> };
    const image = payload.data?.[0]?.b64_json;
    if (!image) throw new Error("Provider returned no image");
    res.json(
      GenerateStoryImageResponse.parse({
        dataUrl: `data:image/png;base64,${image}`,
        caption: input.data.prompt,
      }),
    );
  } catch (error) {
    req.log.error({ err: error }, "Unable to generate story image");
    res.status(503).json({ error: "The image could not be generated." });
  }
});

router.post("/story/voice/transcript", async (req, res) => {
  const input = GenerateVoiceTranscriptBody.safeParse(req.body);
  if (!input.success) { res.status(400).json({ error: "Provide a prompt and language." }); return; }
  if (!providerReady()) { res.status(503).json({ error: "Text AI Provider Not Connected" }); return; }
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-5.6-terra",
        max_completion_tokens: 8192,
        messages: [
          { role: "system", content: `Write a short spontaneous fictional private voice memo, not a speech. Return JSON with title, transcript, context, delivery, category, language (${input.data.language}), and optional relatedEvent. Keep English and Korean naturally mixed when Mixed is selected. Do not imitate or refer to the voice of any real person.` },
          { role: "user", content: input.data.prompt },
        ],
      }),
    });
    if (!response.ok) throw new Error(`Transcript provider returned ${response.status}`);
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("Transcript provider returned no text");
    res.json(GenerateVoiceTranscriptResponse.parse(parseJsonObject(content)));
  } catch (error) {
    req.log.error({ err: error }, "Voice transcript generation failed");
    res.status(503).json({ error: "Could not generate the transcript." });
  }
});

router.post("/story/voice/audio", async (req, res) => {
  const input = GenerateVoiceAudioBody.safeParse(req.body);
  if (!input.success) { res.status(400).json({ error: "Provide a transcript, voice, and language." }); return; }
  if (!providerReady() || !process.env.PRIVATE_OBJECT_DIR) { res.status(503).json({ error: "Audio AI Provider Not Connected" }); return; }
  try {
    const openai = new OpenAI({ apiKey, baseURL: baseUrl });
    const response = await openai.chat.completions.create({
      model: "gpt-audio",
      modalities: ["text", "audio"],
      audio: { voice: input.data.voice, format: "wav" },
      messages: [
        { role: "system", content: `Perform text-to-speech. Speak ONLY the user's transcript verbatim. You are an original fictional synthetic young adult male voice, soft, warm, natural and casual, never an imitation of any real person. Delivery: ${input.data.delivery || "intimate and relaxed"}. Language: ${input.data.language}; preserve English and Korean naturally when mixed. Use realistic pauses without adding words.` },
        { role: "user", content: input.data.transcript },
      ],
    });
    const audioData = response.choices[0]?.message.audio?.data;
    if (!audioData) throw new Error("Audio provider returned no audio.");
    const { wav, durationSeconds } = normalizeWav(Buffer.from(audioData, "base64"));
    const audioId = await saveVoiceAudio(wav);
    res.json(GenerateVoiceAudioResponse.parse({ audioId, durationSeconds }));
  } catch (error) {
    req.log.error({ err: error }, "Voice audio generation failed");
    res.status(503).json({ error: "Could not generate or persist audio. Please try again." });
  }
});

router.get("/story/voice/audio/:audioId", async (req, res) => {
  try {
    const { file, size } = await loadVoiceAudio(String(req.params.audioId));
    const range = req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
    const start = range ? Number(range[1]) : 0;
    const end = range && range[2] ? Number(range[2]) : size - 1;
    if (start >= size || end >= size || start > end) {
      res.status(416).set("Content-Range", `bytes */${size}`).end(); return;
    }
    res.set({ "Content-Type": "audio/wav", "Accept-Ranges": "bytes", "Cache-Control": "private, max-age=3600", "Content-Length": String(end - start + 1) });
    if (range) res.status(206).set("Content-Range", `bytes ${start}-${end}/${size}`);
    file.createReadStream({ start, end }).on("error", error => {
      req.log.error({ err: error }, "Voice audio streaming failed");
      if (!res.headersSent) res.status(500).end(); else res.destroy(error);
    }).pipe(res);
  } catch (error) {
    req.log.warn({ err: error }, "Voice audio not available");
    res.status(404).json({ error: "Audio not found" });
  }
});

export default router;