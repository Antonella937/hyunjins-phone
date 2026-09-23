import { Router, type IRouter } from "express";
import {
  GenerateOriginalLyricsBody,
  GenerateOriginalLyricsResponse,
  GenerateOriginalTrackBody,
  GenerateOriginalTrackResponse,
  GetMusicProviderResponse,
  DiscardOriginalTrackPreviewBody,
  ConfirmOriginalTrackPreviewBody,
} from "@workspace/api-zod";
import {
  confirmMusicPreview,
  discardMusicPreview,
  isMissingObject,
  isPreviewAuthorizationError,
  loadMusicAudio,
  saveMusicAudio,
} from "../lib/musicAudioStorage";

const router: IRouter = Router();
const elevenLabsUrl = "https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128";

function connected() {
  return Boolean(process.env.ELEVENLABS_API_KEY && process.env.PRIVATE_OBJECT_DIR);
}

function isMp3(data: Buffer) {
  if (data.length < 128) return false;
  if (data.subarray(0, 3).toString("ascii") === "ID3") return true;
  for (let i = 0; i < Math.min(data.length - 1, 4096); i += 1) {
    if (data[i] === 0xff && (data[i + 1] & 0xe0) === 0xe0 && (data[i + 1] & 0x06) !== 0) return true;
  }
  return false;
}

function providerMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object") {
    const value = (payload as { detail?: unknown; error?: unknown; message?: unknown }).detail
      ?? (payload as { error?: unknown }).error
      ?? (payload as { message?: unknown }).message;
    if (typeof value === "string" && value.length < 500) return value;
    if (value && typeof value === "object") {
      const message = (value as { message?: unknown }).message;
      if (typeof message === "string" && message.length < 500) return message;
    }
  }
  return fallback;
}

function requestsRealArtistImitation(input: { prompt: string; lyrics?: string; notes?: string }) {
  const text = [input.prompt, input.lyrics, input.notes].filter(Boolean).join(" ");
  return /\b(?:in the style of|sound(?:s)? like|sing like|voice of|imitat(?:e|ing|ion)|clone|copy|impersonat(?:e|ing)|recreate the voice)\b/i.test(text);
}

router.get("/music/provider", (_req, res): void => {
  const ready = connected();
  res.json(GetMusicProviderResponse.parse({
    connected: ready,
    label: ready ? "ElevenLabs Music" : "Music AI Provider Not Connected",
  }));
});

router.post("/music/generate", async (req, res): Promise<void> => {
  const input = GenerateOriginalTrackBody.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: "Please provide a valid original track request." });
    return;
  }
  if (requestsRealArtistImitation(input.data)) {
    res.status(400).json({ error: "Requests to imitate or clone real singers are not supported." });
    return;
  }
  if (!connected()) {
    res.status(503).json({ error: "Music AI Provider Not Connected" });
    return;
  }

  const { prompt, mode, durationSeconds, genre, mood, lyrics, notes } = input.data;
  const compactMode = mode === "loop" || mode === "demo";
  const fullPrompt = [
    compactMode ? "Create a short rough original fragment suitable for a loop/demo." : "Create a complete original track.",
    "This is fictional original synthetic music and voice only; never imitate, resemble, or clone any real singer or recording artist.",
    `User direction: ${prompt}`,
    genre && `Genre: ${genre}`,
    mood && `Mood: ${mood}`,
    lyrics && `Lyrics: ${lyrics}`,
    notes && `Production notes: ${notes}`,
  ].filter(Boolean).join("\n");

  try {
    const response = await fetch(elevenLabsUrl, {
      method: "POST",
      headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY!, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({
        prompt: fullPrompt,
        music_length_ms: durationSeconds * 1000,
        force_instrumental: mode !== "vocals",
      }),
    });
    if (!response.ok) {
      let payload: unknown;
      try { payload = await response.json(); } catch { payload = undefined; }
      res.status(response.status).json({ error: providerMessage(payload, `Music provider returned HTTP ${response.status}.`) });
      return;
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!isMp3(bytes)) {
      res.status(502).json({ error: "Music provider returned invalid audio." });
      return;
    }
    const { audioId, previewToken } = await saveMusicAudio(bytes);
    res.json(GenerateOriginalTrackResponse.parse({ audioId, durationSeconds, contentType: "audio/mpeg", previewToken }));
  } catch (error) {
    req.log.error({ err: error }, "Original music generation failed");
    res.status(503).json({ error: "Could not generate or persist original music." });
  }
});

router.delete("/music/audio/:audioId/preview", async (req, res): Promise<void> => {
  const input = DiscardOriginalTrackPreviewBody.safeParse(req.body);
  if (!input.success) {
    res.status(403).json({ error: "Invalid preview token." });
    return;
  }
  try {
    await discardMusicPreview(String(req.params.audioId), input.data.previewToken);
    res.status(204).end();
  } catch (error) {
    if (isPreviewAuthorizationError(error)) {
      res.status(403).json({ error: "Invalid preview token." });
      return;
    }
    if (isMissingObject(error)) {
      res.status(404).json({ error: "Audio not found" });
      return;
    }
    req.log.warn({ err: error }, "Original music preview discard failed");
    res.status(503).json({ error: "Could not discard audio preview." });
  }
});

router.post("/music/audio/:audioId/confirm", async (req, res): Promise<void> => {
  const input = ConfirmOriginalTrackPreviewBody.safeParse(req.body);
  if (!input.success) {
    res.status(403).json({ error: "Invalid preview token." });
    return;
  }
  try {
    await confirmMusicPreview(String(req.params.audioId), input.data.previewToken);
    res.json({ confirmed: true });
  } catch (error) {
    if (isPreviewAuthorizationError(error)) {
      res.status(403).json({ error: "Invalid preview token." });
      return;
    }
    if (isMissingObject(error)) {
      res.status(404).json({ error: "Audio not found" });
      return;
    }
    req.log.warn({ err: error }, "Original music preview confirmation failed");
    res.status(503).json({ error: "Could not confirm audio preview." });
  }
});

router.get("/music/audio/:audioId", async (req, res): Promise<void> => {
  try {
    const { file, size, contentType } = await loadMusicAudio(String(req.params.audioId));
    const header = req.headers.range;
    const range = header?.match(/^bytes=(\d*)-(\d*)$/);
    if (header && (!range || (!range[1] && !range[2]))) {
      res.status(416).set("Content-Range", `bytes */${size}`).end(); return;
    }
    const suffix = range && !range[1] ? Number(range[2]) : 0;
    const start = suffix ? Math.max(0, size - suffix) : range ? Number(range[1]) : 0;
    const end = range && range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || start > end || size <= 0) {
      res.status(416).set("Content-Range", `bytes */${size}`).end(); return;
    }
    res.set({ "Content-Type": contentType, "Accept-Ranges": "bytes", "Cache-Control": "private, max-age=3600", "Content-Length": String(end - start + 1) });
    if (header) res.status(206).set("Content-Range", `bytes ${start}-${end}/${size}`);
    file.createReadStream({ start, end }).on("error", error => {
      req.log.error({ err: error }, "Original music streaming failed");
      if (!res.headersSent) res.status(500).end(); else res.destroy(error);
    }).pipe(res);
  } catch (error) {
    req.log.warn({ err: error }, "Original music not available");
    res.status(404).json({ error: "Audio not found" });
  }
});

router.post("/music/lyrics", async (req, res): Promise<void> => {
  const input = GenerateOriginalLyricsBody.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: "Please provide a valid lyrics request." });
    return;
  }
  const baseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL?.replace(/\/$/, "");
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  if (!baseUrl || !apiKey) {
    res.status(503).json({ error: "Text AI provider is not connected." });
    return;
  }
  try {
    const { prompt, genre, mood, context } = input.data;
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Write editable original song lyrics only, with no commentary. Do not mention or write romantic lyrics about Nela unless the user's prompt or context explicitly requests Nela. Do not imitate any real artist." },
          { role: "user", content: [prompt, genre && `Genre: ${genre}`, mood && `Mood: ${mood}`, context && `Context: ${context}`].filter(Boolean).join("\n") },
        ],
      }),
    });
    if (!response.ok) {
      let payload: unknown; try { payload = await response.json(); } catch { payload = undefined; }
      res.status(response.status).json({ error: providerMessage(payload, "Lyrics provider request failed.") });
      return;
    }
    const payload = await response.json() as { choices?: Array<{ message?: { content?: unknown } }> };
    const lyrics = payload.choices?.[0]?.message?.content;
    if (typeof lyrics !== "string" || !lyrics.trim()) {
      res.status(502).json({ error: "Lyrics provider returned no lyrics." }); return;
    }
    res.json(GenerateOriginalLyricsResponse.parse({ lyrics }));
  } catch (error) {
    req.log.error({ err: error }, "Original lyrics generation failed");
    res.status(503).json({ error: "Could not generate original lyrics." });
  }
});

export default router;