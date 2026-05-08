import test from "node:test";
import assert from "node:assert/strict";

import { latestMusicFiles, olderMusicFiles, manifestTracksFromFiles, normalizeMusicFile } from "./music-manifest";

test("normalizeMusicFile strips the bg prefix and rejects non-audio entries", () => {
  assert.equal(normalizeMusicFile("bg/dead girl.mp3"), "dead girl.mp3");
  assert.equal(normalizeMusicFile("dead girl.mp3"), "dead girl.mp3");
  assert.equal(normalizeMusicFile("bg/"), null);
  assert.equal(normalizeMusicFile("bg/readme.txt"), null);
});

test("manifestTracksFromFiles keeps only unique audio files and passes stripped names to the url builder", () => {
  const seen: string[] = [];
  const tracks = manifestTracksFromFiles(
    ["bg/zombiemode.mp3", "bg/dead girl.mp3", "bg/", "bg/readme.txt", "dead girl.mp3"],
    (file) => {
      seen.push(file);
      return `https://assets.example/bg/${encodeURIComponent(file)}`;
    },
  );

  assert.deepEqual(seen, ["dead girl.mp3", "zombiemode.mp3"]);
  assert.deepEqual(
    tracks.map((track) => ({ title: track.title, url: track.url })),
    [
      {
        title: "dead girl",
        url: "https://assets.example/bg/dead%20girl.mp3",
      },
      {
        title: "zombiemode",
        url: "https://assets.example/bg/zombiemode.mp3",
      },
    ],
  );
});

test("latestMusicFiles returns the newest limited audio files from R2-style entries", () => {
  const entries = Array.from({ length: 20 }, (_, index) => ({
    key: `bg/song-${index + 1}.mp3`,
    lastModified: new Date(2026, 0, index + 1),
  }));

  const latest = latestMusicFiles(entries, 16);

  assert.equal(latest.length, 16);
  assert.deepEqual(latest.slice(0, 3), ["song-20.mp3", "song-19.mp3", "song-18.mp3"]);
  assert.equal(latest.at(-1), "song-5.mp3");
});

test("olderMusicFiles returns the older batch after the newest songs", () => {
  const entries = Array.from({ length: 40 }, (_, index) => ({
    key: `bg/song-${index + 1}.mp3`,
    lastModified: new Date(2026, 0, index + 1),
  }));

  const older = olderMusicFiles(entries, 20, 16);

  assert.equal(older.length, 20);
  assert.deepEqual(older.slice(0, 3), ["song-24.mp3", "song-23.mp3", "song-22.mp3"]);
  assert.equal(older.at(-1), "song-5.mp3");
});
