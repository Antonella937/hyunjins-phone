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

const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function imageFile(id: string) {
  if (!idPattern.test(id)) throw new Error("Invalid image ID");
  const directory = process.env.PRIVATE_OBJECT_DIR;
  if (!directory) throw new Error("Image storage is not connected.");
  const [bucket, ...parts] = directory.replace(/^\/+/, "").split("/");
  if (!bucket) throw new Error("Image storage is not connected.");
  return storage.bucket(bucket).file([...parts, "story-images", `${id}`].join("/"));
}

export function detectImageType(data: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
  if (data.length >= 3 && data.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return "image/jpeg";
  if (data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (data.length >= 12 && data.toString("ascii", 0, 4) === "RIFF" && data.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

export async function saveStoryImage(data: Buffer, contentType: string) {
  const imageId = randomUUID();
  await imageFile(imageId).save(data, { contentType, resumable: false });
  return imageId;
}

export async function loadStoryImage(id: string) {
  const file = imageFile(id);
  const [metadata] = await file.getMetadata();
  return { file, size: Number(metadata.size), contentType: String(metadata.contentType || "application/octet-stream") };
}