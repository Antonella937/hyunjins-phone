import { Storage } from "@google-cloud/storage";
import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";

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

const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class InvalidAudioIdError extends Error {
  code = 404;
}

function audioFile(id: string) {
  if (!idPattern.test(id)) throw new InvalidAudioIdError("Invalid audio ID");
  const directory = process.env.PRIVATE_OBJECT_DIR;
  if (!directory) throw new Error("Audio storage is not connected.");
  const [bucket, ...parts] = directory.replace(/^\/+/, "").split("/");
  if (!bucket) throw new Error("Audio storage is not connected.");
  return storage.bucket(bucket).file([...parts, "original-tracks", `${id}.mp3`].join("/"));
}

export async function saveMusicAudio(audio: Buffer) {
  const audioId = randomUUID();
  const previewToken = randomBytes(32).toString("hex");
  const previewTokenHash = createHash("sha256").update(previewToken).digest("hex");
  await audioFile(audioId).save(audio, {
    contentType: "audio/mpeg",
    resumable: false,
    metadata: { metadata: { previewTokenHash } },
  });
  return { audioId, previewToken };
}

export async function loadMusicAudio(id: string) {
  const file = audioFile(id);
  const [metadata] = await file.getMetadata();
  return { file, size: Number(metadata.size), contentType: "audio/mpeg" };
}

class PreviewAuthorizationError extends Error {
  code = 403;
}

function isMissingObject(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: unknown }).code === 404);
}

async function authorizePreview(id: string, previewToken: string) {
  const file = audioFile(id);
  let metadata;
  try {
    [metadata] = await file.getMetadata();
  } catch (error) {
    if (isMissingObject(error)) throw error;
    throw error;
  }
  const expected = metadata.metadata?.previewTokenHash;
  if (typeof expected !== "string") throw new PreviewAuthorizationError("Preview is already confirmed.");
  const provided = createHash("sha256").update(previewToken).digest("hex");
  const expectedBytes = Buffer.from(expected, "utf8");
  const providedBytes = Buffer.from(provided, "utf8");
  if (expectedBytes.length !== providedBytes.length || !timingSafeEqual(expectedBytes, providedBytes)) {
    throw new PreviewAuthorizationError("Invalid preview token.");
  }
  return { file, confirmed: metadata.metadata?.confirmed === "true" };
}

export async function discardMusicPreview(id: string, previewToken: string) {
  const { file, confirmed } = await authorizePreview(id, previewToken);
  if (confirmed) throw new PreviewAuthorizationError("Preview is already confirmed.");
  await file.delete();
}

export async function confirmMusicPreview(id: string, previewToken: string) {
  const { file, confirmed } = await authorizePreview(id, previewToken);
  if (!confirmed) {
    await file.setMetadata({ metadata: { previewTokenHash: createHash("sha256").update(previewToken).digest("hex"), confirmed: "true" } });
  }
}

export function isPreviewAuthorizationError(error: unknown) {
  return error instanceof PreviewAuthorizationError;
}

export { isMissingObject };