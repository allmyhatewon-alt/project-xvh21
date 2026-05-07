import assert from "node:assert/strict";

const base = "http://127.0.0.1:3000";
let cookie = "";

async function request(path, options = {}) {
  const res = await fetch(base + path, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
      ...(options.headers || {}),
    },
  });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) cookie = setCookie.split(";")[0];
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => ({})) : {};
  return { status: res.status, data, contentType: res.headers.get("content-type") || "" };
}

const login = await request("/api/auth/login", {
  method: "POST",
  body: JSON.stringify({ email: "admin@pengelus.me", password: "peng12345" }),
});
assert.equal(login.status, 200, "admin login should work");

const settings = {
  enabled: true,
  readChat: true,
  readGifts: true,
  provider: "kitten",
  voice: "Kitten Bruno",
  premiumVoice: "marin",
  instructions: "Sound playful and clean without dragging the sentence.",
  rate: 1.15,
  pitch: 1.05,
  maxLength: 100,
};

const save = await request("/api/live/my", {
  method: "POST",
  body: JSON.stringify({
    title: "kitten voice test",
    category: "creator room",
    platform: "native",
    sourceUrl: "pengelus-native:peng",
    embedUrl: "",
    thumbnailUrl: "",
    isLive: true,
    widgets: JSON.stringify([{ id: "tts-widget", type: "tts", label: "kitten voice", detail: "free ai chat voice", x: 44, y: 20, preset: "neon", enabled: true }]),
    ttsSettings: JSON.stringify(settings),
  }),
});
assert.equal(save.status, 200, "live settings save should work");
assert.equal(save.data.stream.ttsSettings.provider, "kitten", "my live settings should serialize Kitten provider");
assert.equal(save.data.stream.ttsSettings.voice, "Kitten Bruno", "my live settings should keep the Kitten voice label");
assert.match(save.data.stream.widgetUrl, /\/hub\/live\/widgets\/peng\?key=/, "widget source URL should exist");

const publicStream = await request("/api/live?user=peng");
assert.equal(publicStream.status, 200, "public live stream should load");
assert.equal(publicStream.data.stream.ttsSettings.provider, "kitten", "public stream should expose Kitten provider");
assert.equal(publicStream.data.stream.ttsSettings.voice, "Kitten Bruno", "public stream should expose Kitten voice label");

const widgetKey = save.data.stream.widgetUrl.split("key=")[1];
const noService = await request("/api/live/tts", {
  method: "POST",
  body: JSON.stringify({ username: "peng", key: widgetKey, text: "kitten should talk here", author: "peng", isGift: false }),
});
assert.equal(noService.status, 503, "Kitten route should ask for a local service when not configured");
assert.match(noService.data.error, /KITTEN_TTS_URL/, "Kitten error should name the missing env");

console.log(JSON.stringify({ ok: true, provider: publicStream.data.stream.ttsSettings.provider, widgetUrl: save.data.stream.widgetUrl }, null, 2));
