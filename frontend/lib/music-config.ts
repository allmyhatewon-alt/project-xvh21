export type MusicTrack = {
  url: string;
  title: string;
  artist?: string;
};

export const MUSIC_PLAYLIST: MusicTrack[] = [
  { url: "/bg/#IHEARTSERVIN.mp3", title: "#IHEARTSERVIN" },
  { url: "/bg/@VTLBOSS00 -  #Dead n Gone#  _ prod. @_HollywoodJ _.mp3", title: "#Dead n Gone", artist: "@VTLBOSS00" },
  { url: "/bg/Autumn - Outta My Mind! ft. Summrs & Kobe (prod. sadbalmain & eddiegianni).mp3", title: "Outta My Mind!", artist: "Autumn ft. Summrs & Kobe" },
  { url: "/bg/Butterfly Doors [prod.Katlightning].mp3", title: "Butterfly Doors" },
  { url: "/bg/dead girl.mp3", title: "dead girl" },
  { url: "/bg/falloff.mp3", title: "falloff" },
  { url: "/bg/fendi.mp3", title: "fendi" },
  { url: "/bg/get well soon.mp3", title: "get well soon" },
  { url: "/bg/go white boy go (prod. 4am).mp3", title: "go white boy go" },
  { url: "/bg/heal (meraki).mp3", title: "heal", artist: "meraki" },
  { url: "/bg/hyakk ~sofaygo.mp3", title: "hyakk", artist: "sofaygo" },
  { url: "/bg/iapologize.mp3", title: "iapologize" },
  { url: "/bg/LUCILFAUX - hey u.mp3", title: "hey u", artist: "LUCILFAUX" },
  { url: "/bg/my twin ft autumn (prod Kankan).mp3", title: "my twin", artist: "ft autumn" },
  { url: "/bg/notalexg.mp3", title: "notalexg" },
  { url: "/bg/opp pack.mp3", title: "opp pack" },
  { url: "/bg/Right Now.mp3", title: "Right Now" },
  { url: "/bg/Sofaygo - Rat Runners.mp3", title: "Rat Runners", artist: "Sofaygo" },
  { url: "/bg/Starfall - A Lot On My Mind [Prod. Lj].mp3", title: "A Lot On My Mind", artist: "Starfall" },
  { url: "/bg/starfall - I'm okay [Prod. Hoodrixh].mp3", title: "I'm okay", artist: "Starfall" },
  { url: "/bg/Starfall - K! Ft. Osane [Prod. Zvanz].mp3", title: "K!", artist: "Starfall ft. Osane" },
  { url: "/bg/Summrs - In Luv_Not Ok.. (prod. Xangang + Seraph).mp3", title: "In Luv / Not Ok", artist: "Summrs" },
  { url: "/bg/surrounded feat. slump6s.mp3", title: "surrounded", artist: "feat. slump6s" },
  { url: "/bg/Trap.mp3", title: "Trap" },
  { url: "/bg/trust me it gets worse... by misaku foxx.mp3", title: "trust me it gets worse", artist: "misaku foxx" },
  { url: "/bg/ttwlg - yung fazo (why you callin me)- [sped up + reverb].mp3", title: "why you callin me", artist: "yung fazo" },
  { url: "/bg/Up It.mp3", title: "Up It" },
  { url: "/bg/yen - messy torture.mp3", title: "messy torture", artist: "yen" },
  { url: "/bg/yuke - fangs (feat. jaydes).mp3", title: "fangs", artist: "yuke feat. jaydes" },
  { url: "/bg/zombiemode.mp3", title: "zombiemode" },
];

export const FALLBACK_PLAYLIST: MusicTrack[] = MUSIC_PLAYLIST;
