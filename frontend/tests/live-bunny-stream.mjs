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
    title: "bunny stream test",
    category: "replay room",
    platform: "bunny",
    sourceUrl: "123456/eb1c4f77-0cda-46be-b47d-1118ad7c2ffe",
    embedUrl: "",
    thumbnailUrl: "",
    isLive: true,
    widgets: "[]",
    ttsSettings: "{}",
  }),
});
assert.equal(save.status, 200, "bunny stream settings should save");
assert.equal(save.data.stream.platform, "bunny", "studio should keep bunny as a stream type");
assert.equal(save.data.stream.playerKind, "iframe", "bunny should render through iframe player");
assert.equal(
  save.data.stream.resolvedEmbedUrl,
  "https://player.mediadelivery.net/embed/123456/eb1c4f77-0cda-46be-b47d-1118ad7c2ffe?autoplay=true&muted=false&preload=true&responsive=true",
  "bunny source shorthand should normalize to Bunny player embed"
);

const publicStream = await request("/api/live?user=peng");
assert.equal(publicStream.status, 200, "public stream should load");
assert.equal(publicStream.data.stream.platform, "bunny", "public stream should expose bunny");
assert.equal(publicStream.data.stream.embedUrl, save.data.stream.resolvedEmbedUrl, "public stream should expose bunny embed URL");

const videoOnly = await request("/api/live/my", {
  method: "POST",
  body: JSON.stringify({
    title: "bunny video id test",
    category: "replay room",
    platform: "bunny",
    sourceUrl: "eb1c4f77-0cda-46be-b47d-1118ad7c2ffe",
    embedUrl: "",
    thumbnailUrl: "",
    isLive: true,
    widgets: "[]",
    ttsSettings: "{}",
  }),
});
assert.equal(videoOnly.status, 200, "bunny video id should save");
assert.equal(
  videoOnly.data.stream.resolvedEmbedUrl,
  "https://player.mediadelivery.net/embed/651149/eb1c4f77-0cda-46be-b47d-1118ad7c2ffe?autoplay=true&muted=false&preload=true&responsive=true",
  "bunny video id should use configured library id"
);

const cdnPath = await request("/api/live/my", {
  method: "POST",
  body: JSON.stringify({
    title: "bunny cdn path test",
    category: "replay room",
    platform: "bunny",
    sourceUrl: "/sample/live/index.m3u8",
    embedUrl: "",
    thumbnailUrl: "",
    isLive: true,
    widgets: "[]",
    ttsSettings: "{}",
  }),
});
assert.equal(cdnPath.status, 200, "bunny cdn path should save");
assert.equal(cdnPath.data.stream.playerKind, "video", "bunny cdn hls path should use video player");
assert.equal(cdnPath.data.stream.resolvedEmbedUrl, "https://vz-955b0d28-ac4.b-cdn.net/sample/live/index.m3u8", "bunny cdn path should use configured CDN hostname");

console.log(JSON.stringify({ ok: true, embedUrl: publicStream.data.stream.embedUrl }, null, 2));
