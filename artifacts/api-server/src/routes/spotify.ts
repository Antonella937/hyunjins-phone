import { Router, type IRouter } from "express";
import crypto from "node:crypto";

const router: IRouter = Router();
const AUTH_COOKIE = "spotify_auth";
const STATE_COOKIE = "spotify_oauth_state";
const TOKEN_COOKIE = "spotify_token";
const EXPIRED_COOKIE = "spotify_expired";
const SIX_MONTHS = 180 * 24 * 60 * 60 * 1000;
const scopes = [
  "streaming", "user-read-private", "user-read-playback-state",
  "user-modify-playback-state", "playlist-read-private", "playlist-read-collaborative",
].join(" ");

type Auth = { refreshToken: string; createdAt: number; expiresAt: number };
type Token = { accessToken: string; expiresAt: number };
type Track = { id: string; uri: string; name: string; artists: string[]; album: string; artwork: string | null; durationMs: number; externalUrl: string | null };
type Device = { id: string; name: string; type: string; isActive: boolean; isRestricted: boolean };

function key(): Buffer | null {
  const secret = process.env.SESSION_SECRET;
  return secret ? crypto.createHash("sha256").update(secret).digest() : null;
}
function seal(value: unknown): string | null {
  const k = key(); if (!k) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", k, iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), body].map(x => x.toString("base64url")).join(".");
}
function open<T>(value: string | undefined): T | null {
  const k = key(); if (!k || !value) return null;
  try {
    const [iv, tag, body] = value.split(".").map(x => Buffer.from(x, "base64url"));
    const decipher = crypto.createDecipheriv("aes-256-gcm", k, iv); decipher.setAuthTag(tag);
    return JSON.parse(Buffer.concat([decipher.update(body), decipher.final()]).toString()) as T;
  } catch { return null; }
}
function cookies(req: { headers: { cookie?: string } }): Record<string, string> {
  return Object.fromEntries((req.headers.cookie ?? "").split(";").map(x => x.trim().split("="))
    .filter(x => x.length === 2).map(([k, ...v]) => [k, decodeURIComponent(v.join("="))]));
}
function cookieOptions(maxAge?: number) {
  return { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/api/spotify", ...(maxAge === undefined ? {} : { maxAge }) };
}
function productionRedirectUri() {
  const value = process.env.SPOTIFY_PRODUCTION_REDIRECT_URI;
  try { return value && new URL(value).protocol === "https:" ? value : null; } catch { return null; }
}
function developmentRedirectUri() {
  const host = process.env.REPLIT_DEV_DOMAIN;
  return host ? `https://${host.replace(/^https?:\/\//, "").replace(/\/+$/, "")}/api/spotify/callback` : null;
}
function redirectUri() {
  const production = productionRedirectUri();
  const development = developmentRedirectUri();
  if (process.env.NODE_ENV === "production") return production ?? "";
  return development ?? production ?? "";
}
function clientId() { return process.env.SPOTIFY_CLIENT_ID ?? ""; }
function configured() { return Boolean(clientId() && redirectUri() && process.env.SESSION_SECRET); }
function noCache(res: { set: (x: Record<string, string>) => unknown }) {
  res.set({ "Cache-Control": "no-store", Pragma: "no-cache" });
}
function browserRequest(req: { headers: { origin?: string } }): boolean {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(redirectUri()).origin;
  } catch { return false; }
}
function expired(req: any) { return Boolean(cookies(req)[EXPIRED_COOKIE]); }
function authFrom(req: { headers: { cookie?: string } }): Auth | null {
  const auth = open<Auth>(cookies(req)[AUTH_COOKIE]);
  return auth && auth.expiresAt > Date.now() ? auth : null;
}
function track(raw: any): Track | null {
  if (!raw || typeof raw !== "object" || !raw.id) return null;
  return { id: String(raw.id), uri: String(raw.uri ?? `spotify:track:${raw.id}`), name: String(raw.name ?? ""),
    artists: Array.isArray(raw.artists) ? raw.artists.map((a: any) => String(a.name ?? "")) : [],
    album: String(raw.album?.name ?? ""), artwork: raw.album?.images?.[0]?.url ?? null,
    durationMs: Number(raw.duration_ms ?? 0), externalUrl: String(raw.external_urls?.spotify ?? "") };
}
function device(raw: any): Device {
  return { id: String(raw.id), name: String(raw.name ?? ""), type: String(raw.type ?? ""),
    isActive: Boolean(raw.is_active), isRestricted: Boolean(raw.is_restricted) };
}
function errorMessage(status: number) {
  if (status === 403) return "Spotify Premium is required for playback.";
  if (status === 404) return "No active Spotify device or track is available.";
  return "Spotify request failed.";
}
async function upstreamError(response: Response): Promise<string> {
  try {
    const data = await response.json() as { error?: { message?: string } | string; error_description?: string };
    const detail = typeof data.error === "object" ? data.error?.message : data.error_description;
    if (typeof detail === "string" && detail.trim()) return `Spotify: ${detail.trim().slice(0, 180)}`;
  } catch { /* Spotify did not send a JSON error body. */ }
  return errorMessage(response.status);
}
function unavailable(req: any, res: any) {
  const network = Boolean(req.__spotifyNetwork);
  res.status(network ? 503 : 401).json({ error: network ? "Spotify is temporarily unavailable. Check your connection and try again." : "Spotify authentication expired." });
}

async function tokenFor(req: any, res: any): Promise<string | null> {
  if (expired(req)) return null;
  const auth = authFrom(req);
  if (!auth) return null;
  const current = open<Token>(cookies(req)[TOKEN_COOKIE]);
  if (current && current.expiresAt > Date.now() + 30_000) return current.accessToken;
  let response: Response;
  try {
    response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: auth.refreshToken, client_id: clientId() }),
    });
  } catch { req.__spotifyNetwork = true; return null; }
  if (!response.ok) {
    let invalidGrant = false;
    try { invalidGrant = (await response.json() as any).error === "invalid_grant"; } catch { /* provider outage */ }
    if (invalidGrant) {
      res.cookie(EXPIRED_COOKIE, "1", cookieOptions(SIX_MONTHS));
      res.clearCookie(TOKEN_COOKIE, cookieOptions());
    } else {
      req.__spotifyNetwork = true;
    }
    return null;
  }
  const data = await response.json() as any;
  const token = { accessToken: String(data.access_token), expiresAt: Date.now() + Number(data.expires_in ?? 3600) * 1000 };
  res.cookie(TOKEN_COOKIE, seal(token), cookieOptions(Number(data.expires_in ?? 3600) * 1000));
  if (data.refresh_token) {
    const next = { ...auth, refreshToken: String(data.refresh_token) };
    res.cookie(AUTH_COOKIE, seal(next), cookieOptions(Math.max(0, next.expiresAt - Date.now())));
  }
  return token.accessToken;
}
async function spotify(req: any, res: any, path: string, init?: RequestInit): Promise<Response | null> {
  const token = await tokenFor(req, res); if (!token) return null;
  try { return await fetch(`https://api.spotify.com/v1${path}`, { ...init, headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}` } }); }
  catch { req.__spotifyNetwork = true; return null; }
}
function denied(res: any, status: "denied" | "expired" | "error") {
  res.redirect(`/?spotify=${status}`);
}

router.get("/spotify/status", async (req, res): Promise<void> => {
  noCache(res);
  const auth = authFrom(req);
  const currentUri = redirectUri();
  const hasStoredAuth = Boolean(cookies(req)[AUTH_COOKIE]);
  const result: any = { configured: configured(), status: !configured() ? "not_configured" : (expired(req) || hasStoredAuth && !auth ? "authentication_expired" : auth ? "connected" : "ready_to_connect"),
    redirectUri: currentUri, productionRedirectUri: productionRedirectUri() };
  if (auth) {
    const response = await spotify(req, res, "/me");
    if (response?.ok) { const me = await response.json() as any; result.account = { id: me.id, displayName: me.display_name ?? me.id, product: me.product ?? "unknown" }; }
    else if (!response && !(req as any).__spotifyNetwork || response?.status === 401 || response?.status === 400) result.status = "authentication_expired";
  }
  res.json(result);
});

router.get("/spotify/connect", (req, res): void => {
  const currentUri = redirectUri();
  if (!configured()) { res.status(503).json({ error: "Spotify is not configured." }); return; }
  const state = crypto.randomBytes(24).toString("base64url");
  const verifier = crypto.randomBytes(48).toString("base64url");
  const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
  const value = seal({ state, verifier, redirectUri: currentUri, expiresAt: Date.now() + 10 * 60 * 1000 });
  res.cookie(STATE_COOKIE, value, cookieOptions(10 * 60 * 1000));
  const url = new URL("https://accounts.spotify.com/authorize");
  url.search = new URLSearchParams({ client_id: clientId(), response_type: "code", redirect_uri: currentUri, state,
    code_challenge_method: "S256", code_challenge: challenge, scope: scopes }).toString();
  res.redirect(url.toString());
});

router.get("/spotify/callback", async (req, res): Promise<void> => {
  if (!configured()) { denied(res, "error"); return; }
  const q = req.query as Record<string, string>;
  if (q.error === "access_denied") { res.clearCookie(STATE_COOKIE, cookieOptions()); denied(res, "denied"); return; }
  const pending = open<{ state: string; verifier: string; redirectUri: string; expiresAt: number }>(cookies(req)[STATE_COOKIE]);
  res.clearCookie(STATE_COOKIE, cookieOptions());
  if (!pending || pending.expiresAt < Date.now() || !q.state || q.state !== pending.state || pending.redirectUri !== redirectUri()) { denied(res, "expired"); return; }
  if (!q.code) { denied(res, "error"); return; }
  let response: Response;
  try {
  response = await fetch("https://accounts.spotify.com/api/token", { method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "authorization_code", code: q.code, redirect_uri: pending.redirectUri, client_id: clientId(), code_verifier: pending.verifier }) });
  } catch { denied(res, "error"); return; }
  if (!response.ok) { denied(res, "error"); return; }
  const data = await response.json() as any;
  const auth: Auth = { refreshToken: String(data.refresh_token), createdAt: Date.now(), expiresAt: Date.now() + SIX_MONTHS };
  res.clearCookie(EXPIRED_COOKIE, cookieOptions());
  res.cookie(AUTH_COOKIE, seal(auth), cookieOptions(SIX_MONTHS));
  res.cookie(TOKEN_COOKIE, seal({ accessToken: String(data.access_token), expiresAt: Date.now() + Number(data.expires_in) * 1000 }), cookieOptions(Number(data.expires_in) * 1000));
  res.redirect("/?spotify=connected");
});

router.post("/spotify/disconnect", (req, res): void => {
  noCache(res); if (!browserRequest(req)) { res.status(403).json({ error: "Cross-origin request denied." }); return; }
  res.clearCookie(AUTH_COOKIE, cookieOptions()); res.clearCookie(TOKEN_COOKIE, cookieOptions()); res.clearCookie(EXPIRED_COOKIE, cookieOptions()); res.status(204).end();
});

router.get("/spotify/token", async (req, res): Promise<void> => {
  noCache(res); const token = await tokenFor(req, res); if (!token) { unavailable(req, res); return; }
  const current = open<Token>(cookies(req)[TOKEN_COOKIE]); res.json({ accessToken: token, expiresAt: current?.expiresAt ?? Date.now() + 3600000 });
});

router.get("/spotify/playback", async (req, res): Promise<void> => {
  noCache(res); const response = await spotify(req, res, "/me/player");
  if (!response) { unavailable(req, res); return; }
  if (response.status === 204) { res.json(null); return; }
  if (!response.ok) { res.status(response.status).json({ error: await upstreamError(response) }); return; }
  const data = await response.json() as any;
  res.json(data?.item ? { isPlaying: Boolean(data.is_playing), progressMs: Number(data.progress_ms ?? 0),
    track: track(data.item), device: data.device ? device(data.device) : null } : null);
});

router.get("/spotify/devices", async (req, res): Promise<void> => {
  noCache(res); const response = await spotify(req, res, "/me/player/devices");
  if (!response) { unavailable(req, res); return; }
  if (!response.ok) { res.status(response.status).json({ error: await upstreamError(response) }); return; }
  const data = await response.json() as any; res.json({ devices: Array.isArray(data.devices) ? data.devices.map(device) : [] });
});

router.get("/spotify/search", async (req, res): Promise<void> => {
  noCache(res); const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (!q || q.length > 200) { res.status(400).json({ error: "A search query is required." }); return; }
  const response = await spotify(req, res, `/search?${new URLSearchParams({ q, type: "track,artist,album", limit: "20" })}`);
  if (!response) { unavailable(req, res); return; }
  if (!response.ok) { res.status(response.status).json({ error: await upstreamError(response) }); return; }
  const data = await response.json() as any;
  res.json({ tracks: (data.tracks?.items ?? []).map(track).filter(Boolean),
    artists: (data.artists?.items ?? []).map((a: any) => ({ id: a.id, name: a.name, uri: String(a.uri ?? `spotify:artist:${a.id}`), artwork: a.images?.[0]?.url ?? "", externalUrl: String(a.external_urls?.spotify ?? "") })),
    albums: (data.albums?.items ?? []).map((a: any) => ({ id: a.id, name: a.name, uri: String(a.uri ?? `spotify:album:${a.id}`), artists: Array.isArray(a.artists) ? a.artists.map((x: any) => String(x.name ?? "")) : [], artwork: a.images?.[0]?.url ?? "", externalUrl: String(a.external_urls?.spotify ?? "") })) });
});

router.get("/spotify/playlists", async (req, res): Promise<void> => {
  noCache(res); const response = await spotify(req, res, "/me/playlists?limit=50");
  if (!response) { unavailable(req, res); return; }
  if (!response.ok) { res.status(response.status).json({ error: await upstreamError(response) }); return; }
  const data = await response.json() as any;
  res.json({ playlists: (data.items ?? []).map((p: any) => ({ id: p.id, name: p.name, description: p.description ?? null,
    artwork: p.images?.[0]?.url ?? null, trackCount: Number(p.tracks?.total ?? 0), externalUrl: p.external_urls?.spotify ?? null })) });
});

function bodyString(body: any, name: string): string | undefined {
  return typeof body?.[name] === "string" && body[name].length < 500 ? body[name] : undefined;
}
async function command(req: any, res: any, method: string, path: string, body?: any): Promise<void> {
  noCache(res); if (!browserRequest(req)) { res.status(403).json({ error: "Cross-origin request denied." }); return; }
  const response = await spotify(req, res, path, { method, headers: { "Content-Type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  if (!response) { unavailable(req, res); return; }
  if (!response.ok) { res.status(response.status).json({ error: await upstreamError(response) }); return; }
  res.status(204).end();
}
router.put("/spotify/play", async (req, res): Promise<void> => {
  const body: any = {}; const deviceId = bodyString(req.body, "deviceId"); const uri = bodyString(req.body, "uri"); const contextUri = bodyString(req.body, "contextUri");
  if (uri) body.uris = [uri]; if (contextUri) body.context_uri = contextUri;
  if (deviceId) {
    if (!browserRequest(req)) { res.status(403).json({ error: "Cross-origin request denied." }); return; }
    const transfer = await spotify(req, res, "/me/player", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ device_ids: [deviceId], play: false }) });
    if (!transfer) { unavailable(req, res); return; }
    if (!transfer.ok) { res.status(transfer.status).json({ error: await upstreamError(transfer) }); return; }
  }
  await command(req, res, "PUT", "/me/player/play" + (deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : ""), Object.keys(body).length ? body : undefined);
});
router.put("/spotify/pause", async (req, res): Promise<void> => { await command(req, res, "PUT", "/me/player/pause"); });
router.post("/spotify/next", async (req, res): Promise<void> => { await command(req, res, "POST", "/me/player/next"); });
router.post("/spotify/previous", async (req, res): Promise<void> => { await command(req, res, "POST", "/me/player/previous"); });
router.put("/spotify/seek", async (req, res): Promise<void> => {
  const positionMs = Number(req.body?.positionMs);
  if (!Number.isInteger(positionMs) || positionMs < 0) { res.status(400).json({ error: "positionMs must be a non-negative integer." }); return; }
  await command(req, res, "PUT", `/me/player/seek?position_ms=${positionMs}`);
});
router.put("/spotify/transfer", async (req, res): Promise<void> => {
  const deviceId = bodyString(req.body, "deviceId");
  if (!deviceId) { res.status(400).json({ error: "deviceId is required." }); return; }
  await command(req, res, "PUT", "/me/player", { device_ids: [deviceId], play: false });
});

export default router;