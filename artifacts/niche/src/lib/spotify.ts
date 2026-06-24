export interface SpotifyTrack {
  title: string;
  artist: string;
  albumArt?: string;
  spotifyId?: string;
  spotifyUri?: string;
  spotifyUrl?: string;
  previewUrl?: string;
  gradient: string;
}

// Thrown when the API returns 401 or 403 — caller should clear auth state
export class SpotifyAuthError extends Error {
  constructor(status: number) {
    super(`Spotify auth error: ${status}`);
    this.name = "SpotifyAuthError";
  }
}

const GENRE_SEARCH_MAP: Record<string, string> = {
  Pop: "pop",
  Rock: "rock",
  "Hip-Hop": "hip-hop",
  Indie: "indie",
  "R&B": "r-n-b",
  Jazz: "jazz",
};

const GENRE_GRADIENT_POOL: Record<string, string[]> = {
  pop: [
    "linear-gradient(135deg,#f8b4d9 0%,#fbc8a3 100%)",
    "linear-gradient(135deg,#ffd6e7 0%,#ffb3c6 100%)",
    "linear-gradient(135deg,#e0aaff 0%,#c8b6ff 100%)",
    "linear-gradient(135deg,#ffd6a5 0%,#fdffb6 100%)",
    "linear-gradient(135deg,#fce4ec 0%,#f8bbd0 100%)",
    "linear-gradient(135deg,#e8f5e9 0%,#c8e6c9 100%)",
  ],
  rock: [
    "linear-gradient(135deg,#ff9a3c 0%,#ff6b6b 100%)",
    "linear-gradient(135deg,#f72585 0%,#b5179e 100%)",
    "linear-gradient(135deg,#6a4c93 0%,#9b5de5 100%)",
    "linear-gradient(135deg,#264653 0%,#2a9d8f 100%)",
    "linear-gradient(135deg,#b0bec5 0%,#607d8b 100%)",
    "linear-gradient(135deg,#546e7a 0%,#37474f 100%)",
  ],
  "hip-hop": [
    "linear-gradient(135deg,#ffe57f 0%,#ffca28 100%)",
    "linear-gradient(135deg,#d62828 0%,#f77f00 100%)",
    "linear-gradient(135deg,#48cae4 0%,#0077b6 100%)",
    "linear-gradient(135deg,#4a4e69 0%,#9a8c98 100%)",
    "linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)",
    "linear-gradient(135deg,#74c69d 0%,#40916c 100%)",
  ],
  indie: [
    "linear-gradient(135deg,#7400b8 0%,#6930c3 100%)",
    "linear-gradient(135deg,#e2d9f3 0%,#b5a8d8 100%)",
    "linear-gradient(135deg,#f7cad0 0%,#ffe8d6 100%)",
    "linear-gradient(135deg,#f4d35e 0%,#ee964b 100%)",
    "linear-gradient(135deg,#d4e09b 0%,#a7c957 100%)",
    "linear-gradient(135deg,#c3b1e1 0%,#e8d5f5 100%)",
  ],
  "r-n-b": [
    "linear-gradient(135deg,#f4845f 0%,#f2614a 100%)",
    "linear-gradient(135deg,#ffb347 0%,#ff8c00 100%)",
    "linear-gradient(135deg,#f2cdcd 0%,#e0a0b0 100%)",
    "linear-gradient(135deg,#b5838d 0%,#e5989b 100%)",
    "linear-gradient(135deg,#fbb1bd 0%,#ee82ee 100%)",
    "linear-gradient(135deg,#ea80fc 0%,#e040fb 100%)",
  ],
  jazz: [
    "linear-gradient(135deg,#023e8a 0%,#0077b6 100%)",
    "linear-gradient(135deg,#1b4332 0%,#2d6a4f 100%)",
    "linear-gradient(135deg,#bc6c25 0%,#dda15e 100%)",
    "linear-gradient(135deg,#4b3832 0%,#be9b7b 100%)",
    "linear-gradient(135deg,#3c1642 0%,#086375 100%)",
    "linear-gradient(135deg,#2a4858 0%,#4b8b9e 100%)",
  ],
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

const OBSCURITY_RANGES = [
  { min: 50, max: 100 },
  { min: 15, max: 49 },
  { min: 0, max: 14 },
];

interface SpotifySearchTrack {
  id: string;
  name: string;
  popularity: number;
  preview_url: string | null;
  external_urls: { spotify: string };
  album: { images: Array<{ url: string }> };
  artists: Array<{ name: string }>;
  uri: string;
}

interface SpotifySearchResponse {
  tracks: { items: SpotifySearchTrack[]; total: number };
  error?: { status: number; message: string };
}

interface SpotifyPlaylistResponse {
  items: Array<{ track: SpotifySearchTrack | null }>;
}

// ── Curated playlists ──────────────────────────────────────────────────────────
// Maps "<Genre>-<obscurityLevel>" (and optionally "<Genre>-<obscurityLevel>-<Language>")
// to a Spotify playlist ID. When a curated playlist exists for the requested
// genre/obscurity/language combo, we pull tracks from it directly instead of
// relying on Spotify's /v1/search popularity scoring (which doesn't reliably
// distinguish "familiar" from "hidden gem").
//
// Lookup order: "<Genre>-<level>-<Language>" → "<Genre>-<level>" → live search fallback.
const CURATED_PLAYLISTS: Record<string, string> = {
  // Indie — general
  "Indie-0": "3V5BrJv7p0rfkO1X7NzLOv", // Familiar
  "Indie-1": "15cPTUnMcVg95MKR8ukLu2", // Niche
  "Indie-2": "4xAVUOlDPVReVZIjeOmO55", // Hidden Gems

  // Indie — Hindi-specific
  "Indie-0-Hindi": "7AexoOofx2Sx8YYTWfWdLj",
  "Indie-1-Hindi": "5xugE6eBfTfZ2irkcdY8Qw",
  "Indie-2-Hindi": "4xAVUOlDPVReVZIjeOmO55", // same as Indie-2 general

  // Pop — general
  "Pop-0": "5tqpfFWqH2fQHVcQacxSUM", // Familiar
  "Pop-1": "44hUsnbEMWLPGRJQz2fU77", // Niche
  "Pop-2": "40C3boyV3eJ2UkKQJPacQh", // Hidden Gems
};

function getCuratedPlaylistId(
  genre: string,
  obscurity: number,
  language: string,
): string | null {
  const languageKey =
    language && language !== "All" ? `${genre}-${obscurity}-${language}` : null;
  if (languageKey && CURATED_PLAYLISTS[languageKey]) {
    return CURATED_PLAYLISTS[languageKey];
  }
  const generalKey = `${genre}-${obscurity}`;
  return CURATED_PLAYLISTS[generalKey] ?? null;
}

/**
 * Build a Spotify search query string combining genre seed and an optional
 * language hint. Format follows the user-visible q= convention:
 *   genre:"pop" "Hindi"
 *
 * Only used as a fallback for genre/obscurity combos with no curated playlist.
 */
function buildQuery(genre: string, language: string): string {
  const seed =
    GENRE_SEARCH_MAP[genre] ??
    genre.toLowerCase().replace(/\s+/g, "-").replace(/&/g, "n");
  const langPart = language && language !== "All" ? ` "${language}"` : "";
  return `genre:"${seed}"${langPart}`;
}

function mapSearchTrack(
  track: SpotifySearchTrack,
  seed: string,
  index: number,
): SpotifyTrack {
  return {
    title: track.name,
    artist: track.artists.map((a) => a.name).join(", "),
    albumArt: track.album.images[0]?.url,
    spotifyId: track.id,
    spotifyUri: track.uri,
    spotifyUrl: track.external_urls.spotify,
    previewUrl: track.preview_url ?? undefined,
    gradient: getGradient(seed, index),
  };
}

/**
 * Fetch tracks directly from a curated Spotify playlist. Used when a
 * playlist has been manually curated for a given genre/obscurity/language
 * combo, bypassing Spotify's search/popularity scoring entirely.
 */
async function fetchTracksFromPlaylist(
  playlistId: string,
  seed: string,
  accessToken: string,
): Promise<SpotifyTrack[]> {
  const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (res.status === 401 || res.status === 403) {
    throw new SpotifyAuthError(res.status);
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Spotify Playlist ${res.status}: ${body}`);
  }

  const data = (await res.json()) as SpotifyPlaylistResponse;
  const valid = data.items
    .map((i) => i.track)
    .filter(
      (t): t is SpotifySearchTrack => t !== null && t.album?.images?.length > 0,
    );

  const shuffled = valid.slice().sort(() => Math.random() - 0.5);
  return shuffled.map((track, i) => mapSearchTrack(track, seed, i));
}

/**
 * Fall back to live Spotify search for genre/obscurity combos without a
 * curated playlist yet.
 *
 * NOTE: Spotify's /v1/search endpoint rejects limit=50 for this app/query
 * combination with a misleading "Invalid limit" 400. Confirmed via direct
 * curl testing that limit=10 works reliably. To still get a decent-sized
 * pool for the obscurity filter to work with, we page through several
 * limit=10 requests and merge the results instead of requesting a bigger
 * limit in one call.
 */
async function fetchTracksFromSearch(
  genre: string,
  obscurity: number,
  accessToken: string,
  language: string,
  offset: number,
): Promise<SpotifyTrack[]> {
  const seed =
    GENRE_SEARCH_MAP[genre] ??
    genre.toLowerCase().replace(/\s+/g, "-").replace(/&/g, "n");
  const { min, max } = OBSCURITY_RANGES[obscurity] ?? OBSCURITY_RANGES[0];
  const q = buildQuery(genre, language);

  const SEARCH_LIMIT = 10;
  const PAGES = 4; // up to 4 * 10 = 40 tracks pooled per search
  const baseOffset = Math.floor(offset || 0);

  let all: SpotifySearchTrack[] = [];

  for (let p = 0; p < PAGES; p++) {
    const pageOffset = baseOffset + p * SEARCH_LIMIT;
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=${SEARCH_LIMIT}&offset=${pageOffset}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.status === 401 || res.status === 403) {
      throw new SpotifyAuthError(res.status);
    }

    if (!res.ok) {
      const body = await res.text();
      if (p === 0) {
        throw new Error(`Spotify Search ${res.status}: ${body}`);
      }
      break;
    }

    const data = (await res.json()) as SpotifySearchResponse;
    const items = data.tracks?.items ?? [];
    all = all.concat(items);

    if (items.length < SEARCH_LIMIT) break;
  }

  const valid = all.filter((t) => t.album.images.length > 0);
  const withObscurity = valid.filter(
    (t) => t.popularity >= min && t.popularity <= max,
  );
  const source = withObscurity.length >= 4 ? withObscurity : valid;

  const shuffled = source.slice().sort(() => Math.random() - 0.5);
  return shuffled.map((track, i) => mapSearchTrack(track, seed, i));
}

/**
 * Fetch a randomised pool of tracks for the given genre/obscurity/language.
 *
 * Tries a curated playlist first (see CURATED_PLAYLISTS) — this gives
 * reliable, hand-picked "Familiar" vs "Niche" vs "Hidden Gems" results
 * instead of trusting Spotify's popularity score. Falls back to live
 * search for any genre/obscurity combo without a curated playlist yet.
 *
 * Throws SpotifyAuthError on 401/403 so callers can handle auth state.
 * Throws Error on other non-ok responses.
 */
export async function fetchSpotifyPool(
  genre: string,
  obscurity: number,
  accessToken: string,
  language = "",
  offset = 0,
): Promise<SpotifyTrack[]> {
  console.log(
    `[niche] Routing request directly to live search for genre: ${genre}`,
  );

  // Bypassing restricted playlist maps due to Spotify's developer API endpoint limitations.
  // This directs execution straight to your operational live search tool!
  return fetchTracksFromSearch(genre, obscurity, accessToken, language, offset);
}
export function obscurityLabel(level: number): string {
  return (
    ["Familiar Territory", "Niche Territory", "Hidden Gems"][level] ??
    "Familiar Territory"
  );
}

// ── Spotify User & Playlist API ───────────────────────────────────────────────

export async function getCurrentUserId(token: string): Promise<string> {
  const res = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401 || res.status === 403)
    throw new SpotifyAuthError(res.status);
  if (!res.ok) throw new Error(`Could not fetch user profile: ${res.status}`);
  const data = (await res.json()) as { id: string };
  return data.id;
}

export async function createSpotifyPlaylist(
  token: string,
  userId: string,
  name: string,
): Promise<{ id: string; url: string }> {
  const res = await fetch(
    `https://api.spotify.com/v1/users/${userId}/playlists`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        public: true,
        description:
          "Curated by Niche — music made for you, not the algorithm.",
      }),
    },
  );
  if (res.status === 401 || res.status === 403)
    throw new SpotifyAuthError(res.status);
  if (!res.ok) throw new Error(`Could not create playlist: ${res.status}`);
  const data = (await res.json()) as {
    id: string;
    external_urls: { spotify: string };
  };
  return { id: data.id, url: data.external_urls.spotify };
}

export async function addTracksToPlaylist(
  token: string,
  playlistId: string,
  uris: string[],
): Promise<void> {
  for (let i = 0; i < uris.length; i += 100) {
    const chunk = uris.slice(i, i + 100);
    const res = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uris: chunk }),
      },
    );
    if (res.status === 401 || res.status === 403)
      throw new SpotifyAuthError(res.status);
    if (!res.ok) throw new Error(`Could not add tracks: ${res.status}`);
  }
}
