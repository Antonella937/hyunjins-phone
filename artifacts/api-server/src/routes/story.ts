import { Router, type IRouter } from "express";
import {
  GenerateStoryActivityBody,
  GenerateStoryActivityResponse,
  GenerateStoryImageBody,
  GenerateStoryImageResponse,
  GetStoryProvidersResponse,
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
      audio: { connected: false, label: "Not connected" },
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

export default router;