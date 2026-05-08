import test from "node:test";
import assert from "node:assert/strict";

import { manifestTracksFromFiles, normalizeMusicFile } from "./music-manifest";

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
