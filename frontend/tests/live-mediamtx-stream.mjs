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

const save = await request("/api/live/my", {
  method: "POST",
  body: JSON.stringify({
    title: "mediamtx ingest test",
    category: "native ingest",
    platform: "mediamtx",
    sourceUrl: "peng",
    embedUrl: "",
    thumbnailUrl: "",
    isLive: true,
    widgets: "[]",
    ttsSettings: "{}",
  }),
});
assert.equal(save.status, 200, "MediaMTX stream settings should save");
assert.equal(save.data.stream.platform, "mediamtx", "studio should keep MediaMTX as a stream type");
assert.equal(save.data.stream.playerKind, "iframe", "MediaMTX browser player should render through iframe");
assert.equal(
  save.data.stream.resolvedEmbedUrl,
  "http://127.0.0.1:8888/peng?muted=false&autoplay=true&playsInline=true",
  "MediaMTX path should normalize to HLS browser player"
);

const publicStream = await request("/api/live?user=peng");
assert.equal(publicStream.status, 200, "public stream should load");
assert.equal(publicStream.data.stream.platform, "mediamtx", "public stream should expose MediaMTX");
assert.equal(publicStream.data.stream.embedUrl, save.data.stream.resolvedEmbedUrl, "public stream should expose MediaMTX player URL");

console.log(JSON.stringify({ ok: true, embedUrl: publicStream.data.stream.embedUrl }, null, 2));
