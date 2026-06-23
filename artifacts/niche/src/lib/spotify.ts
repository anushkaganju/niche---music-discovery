export interface SpotifyTrack {
  title: string;
  artist: string;
  albumArt?: string;
  spotifyId?: string;
  previewUrl?: string;
  gradient: string;
}

const GENRE_SEARCH_MAP: Record<string, string> = {
  "Pop": "pop",
  "Rock": "rock",
  "Hip-Hop": "hip-hop",
  "Indie": "indie",
  "R&B": "r-n-b",
  "Jazz": "jazz",
};

const GENRE_GRADIENT_POOL: Record<string, string[]> = {
  "pop":    ["linear-gradient(135deg,#f8b4d9 0%,#fbc8a3 100%)", "linear-gradient(135deg,#ffd6e7 0%,#ffb3c6 100%)", "linear-gradient(135deg,#e0aaff 0%,#c8b6ff 100%)", "linear-gradient(135deg,#ffd6a5 0%,#fdffb6 100%)", "linear-gradient(135deg,#fce4ec 0%,#f8bbd0 100%)", "linear-gradient(135deg,#e8f5e9 0%,#c8e6c9 100%)"],
  "rock":   ["linear-gradient(135deg,#ff9a3c 0%,#ff6b6b 100%)", "linear-gradient(135deg,#f72585 0%,#b5179e 100%)", "linear-gradient(135deg,#6a4c93 0%,#9b5de5 100%)", "linear-gradient(135deg,#264653 0%,#2a9d8f 100%)", "linear-gradient(135deg,#b0bec5 0%,#607d8b 100%)", "linear-gradient(135deg,#546e7a 0%,#37474f 100%)"],
  "hip-hop":["linear-gradient(135deg,#ffe57f 0%,#ffca28 100%)", "linear-gradient(135deg,#d62828 0%,#f77f00 100%)", "linear-gradient(135deg,#48cae4 0%,#0077b6 100%)", "linear-gradient(135deg,#4a4e69 0%,#9a8c98 100%)", "linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)", "linear-gradient(135deg,#74c69d 0%,#40916c 100%)"],
  "indie":  ["linear-gradient(135deg,#7400b8 0%,#6930c3 100%)", "linear-gradient(135deg,#e2d9f3 0%,#b5a8d8 100%)", "linear-gradient(135deg,#f7cad0 0%,#ffe8d6 100%)", "linear-gradient(135deg,#f4d35e 0%,#ee964b 100%)", "linear-gradient(135deg,#d4e09b 0%,#a7c957 100%)", "linear-gradient(135deg,#c3b1e1 0%,#e8d5f5 100%)"],
  "r-n-b":  ["linear-gradient(135deg,#f4845f 0%,#f2614a 100%)", "linear-gradient(135deg,#ffb347 0%,#ff8c00 100%)", "linear-gradient(135deg,#f2cdcd 0%,#e0a0b0 100%)", "linear-gradient(135deg,#b5838d 0%,#e5989b 100%)", "linear-gradient(135deg,#fbb1bd 0%,#ee82ee 100%)", "linear-gradient(135deg,#ea80fc 0%,#e040fb 100%)"],
  "jazz":   ["linear-gradient(135deg,#023e8a 0%,#0077b6 100%)", "linear-gradient(135deg,#1b4332 0%,#2d6a4f 100%)", "linear-gradient(135deg,#bc6c25 0%,#dda15e 100%)", "linear-gradient(135deg,#4b3832 0%,#be9b7b 100%)", "linear-gradient(135deg,#3c1642 0%,#086375 100%)", "linear-gradient(135deg,#2a4858 0%,#4b8b9e 100%)"],
};

const FALLBACK_GRADIENTS = [
  "linear-gradient(135deg,#e0c3fc 0%,#8ec5fc 100%)",
  "linear-gradient(135deg,#a1c4fd 0%,#c2e9fb 100%)",
  "linear-gradient(135deg,#fccb90 0%,#d57eeb 100%)",
  "linear-gradient(135deg,#a18cd1 0%,#fbc2eb 100%)",
  "linear-gradient(135deg,#84fab0 0%,#8fd3f4 100%)",
  "linear-gradient(135deg,#fddb92 0%,#d1fdff 100%)",
];

function getGradient(seed: string, index: number): string {
  const pool = GENRE_GRADIENT_POOL[seed] ?? FALLBACK_GRADIENTS;
  return pool[index % pool.length];
}

interface PopularityRange {
  min: number;
  max: number;
}

const OBSCURITY_RANGES: PopularityRange[] = [
  { min: 60, max: 100 },
  { min: 20, max: 59  },
  { min: 0,  max: 29  },
];

interface SpotifySearchTrack {
  id: string;
  name: string;
  popularity: number;
  preview_url: string | null;
  album: { images: Array<{ url: string }> };
  artists: Array<{ name: string }>;
}

interface SpotifySearchResponse {
  tracks: {
    items: SpotifySearchTrack[];
  };
}

export async function fetchSpotifyRecommendations(
  genre: string,
  obscurity: number,
  accessToken: string,
  limit = 6,
): Promise<SpotifyTrack[]> {
  const seed = GENRE_SEARCH_MAP[genre] ?? genre.toLowerCase().replace(/\s+/g, "-").replace(/&/g, "n");
  const { min, max } = OBSCURITY_RANGES[obscurity] ?? OBSCURITY_RANGES[0];

  const params = new URLSearchParams({
    q: `genre:"${seed}"`,
    type: "track",
    limit: "50",
    market: "US",
  });

  const res = await fetch(`https://api.spotify.com/v1/search?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Spotify Search API ${res.status}: ${body}`);
  }

  const data = await res.json() as SpotifySearchResponse;
  const allTracks = data.tracks?.items ?? [];

  const filtered = allTracks.filter(
    t => t.popularity >= min && t.popularity <= max,
  );

  const pool = filtered.length >= limit ? filtered : allTracks;

  const shuffled = pool
    .slice()
    .sort(() => Math.random() - 0.5)
    .slice(0, limit);

  return shuffled.map((track, i) => ({
    title: track.name,
    artist: track.artists.map(a => a.name).join(", "),
    albumArt: track.album.images[0]?.url,
    spotifyId: track.id,
    previewUrl: track.preview_url ?? undefined,
    gradient: getGradient(seed, i),
  }));
}

export function obscurityLabel(level: number): string {
  return ["Familiar Territory", "Niche Territory", "Hidden Gems"][level] ?? "Familiar Territory";
}

export function maxPopularityForLevel(level: number): number {
  return OBSCURITY_RANGES[level]?.max ?? 100;
}
