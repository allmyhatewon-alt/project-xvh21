export type MusicTrack = {
  url: string;
  title: string;
  artist?: string;
};

type RawTrack = Omit<MusicTrack, "url"> & { file: string };

const RAW_PLAYLIST: RawTrack[] = [
  { file: "#IHEARTSERVIN.mp3", title: "#IHEARTSERVIN" },
  { file: "@VTLBOSS00 -  #Dead n Gone#  _ prod. @_HollywoodJ _.mp3", title: "#Dead n Gone", artist: "@VTLBOSS00" },
  { file: "Autumn - Outta My Mind! ft. Summrs & Kobe (prod. sadbalmain & eddiegianni).mp3", title: "Outta My Mind!", artist: "Autumn ft. Summrs & Kobe" },
  { file: "Butterfly Doors [prod.Katlightning].mp3", title: "Butterfly Doors" },
  { file: "dead girl.mp3", title: "dead girl" },
  { file: "falloff.mp3", title: "falloff" },
  { file: "fendi.mp3", title: "fendi" },
  { file: "get well soon.mp3", title: "get well soon" },
  { file: "go white boy go (prod. 4am).mp3", title: "go white boy go" },
  { file: "heal (meraki).mp3", title: "heal", artist: "meraki" },
  { file: "hyakk ~sofaygo.mp3", title: "hyakk", artist: "sofaygo" },
  { file: "iapologize.mp3", title: "iapologize" },
  { file: "LUCILFAUX - hey u.mp3", title: "hey u", artist: "LUCILFAUX" },
  { file: "my twin ft autumn (prod Kankan).mp3", title: "my twin", artist: "ft autumn" },
  { file: "notalexg.mp3", title: "notalexg" },
  { file: "opp pack.mp3", title: "opp pack" },
  { file: "Right Now.mp3", title: "Right Now" },
  { file: "Sofaygo - Rat Runners.mp3", title: "Rat Runners", artist: "Sofaygo" },
  { file: "Starfall - A Lot On My Mind [Prod. Lj].mp3", title: "A Lot On My Mind", artist: "Starfall" },
  { file: "starfall - I'm okay [Prod. Hoodrixh].mp3", title: "I'm okay", artist: "Starfall" },
  { file: "Starfall - K! Ft. Osane [Prod. Zvanz].mp3", title: "K!", artist: "Starfall ft. Osane" },
  { file: "Summrs - In Luv_Not Ok.. (prod. Xangang + Seraph).mp3", title: "In Luv / Not Ok", artist: "Summrs" },
  { file: "surrounded feat. slump6s.mp3", title: "surrounded", artist: "feat. slump6s" },
  { file: "Trap.mp3", title: "Trap" },
  { file: "trust me it gets worse... by misaku foxx.mp3", title: "trust me it gets worse", artist: "misaku foxx" },
  { file: "ttwlg - yung fazo (why you callin me)- [sped up + reverb].mp3", title: "why you callin me", artist: "yung fazo" },
  { file: "Up It.mp3", title: "Up It" },
  { file: "yen - messy torture.mp3", title: "messy torture", artist: "yen" },
  { file: "yuke - fangs (feat. jaydes).mp3", title: "fangs", artist: "yuke feat. jaydes" },
  { file: "zombiemode.mp3", title: "zombiemode" },
];

function publicBase() {
  const base = process.env.NEXT_PUBLIC_MUSIC_BASE_URL?.trim() || process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.trim() || "";
  return base.replace(/\/+$/, "");
}

function urlForFile(file: string) {
  const base = publicBase();
  if (base) {
    return `${base}/bg/${file}`;
  }
  if (process.env.NODE_ENV === "development") {
    return `/bg/${file}`;
  }
  return "";
}

export const MUSIC_PLAYLIST: MusicTrack[] = RAW_PLAYLIST
  .map((track) => ({
    url: urlForFile(track.file),
    title: track.title,
    artist: track.artist,
  }))
  .filter((track) => track.url);

export const FALLBACK_PLAYLIST: MusicTrack[] = MUSIC_PLAYLIST;
