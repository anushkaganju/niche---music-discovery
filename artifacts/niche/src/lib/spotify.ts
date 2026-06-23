export interface SpotifyTrack {
  title: string;
  artist: string;
  albumArt?: string;
  spotifyId?: string;
  previewUrl?: string;
  gradient: string;
}

const GENRE_SEED_MAP: Record<string, string> = {
  "Pop": "pop",
  "Rock": "rock",
  "Hip-Hop": "hip-hop",
  "Indie": "indie",
  "R&B": "r-n-b",
  "Jazz": "jazz",
};

const GENRE_GRADIENT_MAP: Record<string, string[]> = {
  "pop":    ["linear-gradient(135deg,#f8b4d9 0%,#fbc8a3 100%)", "linear-gradient(135deg,#ffd6e7 0%,#ffb3c6 100%)", "linear-gradient(135deg,#e0aaff 0%,#c8b6ff 100%)"],
  "rock":   ["linear-gradient(135deg,#ff9a3c 0%,#ff6b6b 100%)", "linear-gradient(135deg,#6a4c93 0%,#9b5de5 100%)", "linear-gradient(135deg,#264653 0%,#2a9d8f 100%)"],
  "hip-hop":["linear-gradient(135deg,#ffe57f 0%,#ffca28 100%)", "linear-gradient(135deg,#48cae4 0%,#0077b6 100%)", "linear-gradient(135deg,#4a4e69 0%,#9a8c98 100%)"],
  "indie":  ["linear-gradient(135deg,#7400b8 0%,#6930c3 100%)", "linear-gradient(135deg,#e2d9f3 0%,#b5a8d8 100%)", "linear-gradient(135deg,#f7cad0 0%,#ffe8d6 100%)"],
  "r-n-b":  ["linear-gradient(135deg,#f4845f 0%,#f2614a 100%)", "linear-gradient(135deg,#f2cdcd 0%,#e0a0b0 100%)", "linear-gradient(135deg,#b5838d 0%,#e5989b 100%)"],
  "jazz":   ["linear-gradient(135deg,#023e8a 0%,#0077b6 100%)", "linear-gradient(135deg,#bc6c25 0%,#dda15e 100%)", "linear-gradient(135deg,#4b3832 0%,#be9b7b 100%)"],
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
  const pool = GENRE_GRADIENT_MAP[seed] ?? FALLBACK_GRADIENTS;
  return pool[index % pool.length];
}

const OBSCURITY_PARAMS: Array<{ maxPopularity: number; minPopularity: number }> = [
  { maxPopularity: 100, minPopularity: 55 },
  { maxPopularity: 58,  minPopularity: 15 },
  { maxPopularity: 32,  minPopularity: 0  },
];

export async function fetchSpotifyRecommendations(
  genre: string,
  obscurity: number,
  accessToken: string,
  limit = 6,
): Promise<SpotifyTrack[]> {
  const seed = GENRE_SEED_MAP[genre] ?? genre.toLowerCase().replace(/\s+/g, "-").replace(/&/g, "n");
  const { maxPopularity, minPopularity } = OBSCURITY_PARAMS[obscurity] ?? OBSCURITY_PARAMS[0];

  const params = new URLSearchParams({
    seed_genres: seed,
    limit: String(limit),
    max_popularity: String(maxPopularity),
    min_popularity: String(minPopularity),
  });

  const res = await fetch(`https://api.spotify.com/v1/recommendations?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Spotify API error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json() as {
    tracks: Array<{
      id: string;
      name: string;
      preview_url: string | null;
      album: { images: Array<{ url: string }> };
      artists: Array<{ name: string }>;
    }>;
  };

  return data.tracks.map((track, i) => ({
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
  return OBSCURITY_PARAMS[level]?.maxPopularity ?? 100;
}
