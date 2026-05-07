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
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
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
  provider: "openai",
  voice: "peng pulse",
  premiumVoice: "marin",
  instructions: "Sound like a clean hype livestream announcer.",
  rate: 1.05,
  pitch: 1.1,
  maxLength: 90,
};
const widgets = [
  { id: "tts-widget", type: "tts", label: "voice engine", detail: "chat reads out loud", x: 54, y: 18, preset: "neon", enabled: true },
];

const save = await request("/api/live/my", {
  method: "POST",
  body: JSON.stringify({
    title: "pengelus native test",
    category: "creator room",
    platform: "native",
    sourceUrl: "pengelus-native:peng",
    embedUrl: "",
    thumbnailUrl: "",
    isLive: true,
    widgets: JSON.stringify(widgets),
    ttsSettings: JSON.stringify(settings),
  }),
});
assert.equal(save.status, 200, "live settings save should work");
assert.equal(save.data.stream.ttsSettings.enabled, true, "my live settings should serialize TTS");
assert.equal(save.data.stream.ttsSettings.provider, "openai", "my live settings should serialize premium provider");
assert.match(save.data.stream.widgetUrl, /\/hub\/live\/widgets\/peng\?key=/, "my stream should expose a widget browser-source URL");

const publicStream = await request("/api/live?user=peng");
assert.equal(publicStream.status, 200, "public live stream should load");
assert.equal(publicStream.data.stream.ttsSettings.readChat, true, "public stream should expose safe TTS settings");
assert.equal(publicStream.data.stream.ttsSettings.premiumVoice, "marin", "public stream should expose premium voice choice");
assert.equal(publicStream.data.stream.widgets[0].type, "tts", "public stream should expose TTS widget");

const chatText = `tts comment ${Date.now()}`;
const chat = await request("/api/chat", {
  method: "POST",
  body: JSON.stringify({ body: chatText, room: "live:peng" }),
});
assert.equal(chat.status, 201, "live chat post should work");
assert.equal(chat.data.message.room, "live:peng", "chat should stay in the live room");
assert.equal(chat.data.message.body, chatText, "chat body should round trip for TTS");

console.log(JSON.stringify({ ok: true, widgetUrl: save.data.stream.widgetUrl, chatText }, null, 2));
