import { Storage } from "@google-cloud/storage";
import { randomUUID } from "node:crypto";

const sidecar = "http://127.0.0.1:1106";
const storage = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${sidecar}/token`,
    type: "external_account",
    credential_source: {
      url: `${sidecar}/credential`,
      format: { type: "json", subject_token_field_name: "access_token" },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

function audioFile(id: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw new Error("Invalid audio ID");
  }
  const directory = process.env.PRIVATE_OBJECT_DIR;
  if (!directory) throw new Error("Audio storage is not connected.");
  const [bucket, ...parts] = directory.replace(/^\/+/, "").split("/");
  if (!bucket) throw new Error("Audio storage is not connected.");
  return storage.bucket(bucket).file([...parts, "voice-memos", `${id}.wav`].join("/"));
}

export async function saveVoiceAudio(wav: Buffer) {
  const audioId = randomUUID();
  await audioFile(audioId).save(wav, { contentType: "audio/wav", resumable: false });
  return audioId;
}

export async function loadVoiceAudio(id: string) {
  const file = audioFile(id);
  const [metadata] = await file.getMetadata();
  return { file, size: Number(metadata.size) };
}

export function normalizeWav(wav: Buffer) {
  if (wav.toString("ascii", 0, 4) !== "RIFF" || wav.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error("Audio provider returned an unsupported file.");
  }
  let offset = 12;
  let bytesPerSecond = 0;
  let dataLength = 0;
  while (offset + 8 <= wav.length) {
    const name = wav.toString("ascii", offset, offset + 4);
    const length = wav.readUInt32LE(offset + 4);
    if (name === "fmt " && length >= 16) bytesPerSecond = wav.readUInt32LE(offset + 16);
    if (name === "data") {
      // gpt-audio WAVs use 0xffffffff for streaming sizes; replace with the actual bytes
      // so HTML audio can report the true duration and seek reliably after reopening.
      dataLength = Math.min(length, wav.length - offset - 8);
      wav.writeUInt32LE(dataLength, offset + 4);
      wav.writeUInt32LE(wav.length - 8, 4);
      break;
    }
    offset += 8 + length + (length % 2);
  }
  if (!bytesPerSecond || !dataLength) throw new Error("Audio provider returned an invalid WAV file.");
  return { wav, durationSeconds: dataLength / bytesPerSecond };
}