import { useState, useEffect, useCallback, useRef } from "react";
import { SiSpotify } from "react-icons/si";
import { AnimatePresence, motion } from "framer-motion";
import {
  fetchSpotifyPool,
  obscurityLabel,
  getCurrentUserId,
  createSpotifyPlaylist,
  addTracksToPlaylist,
  SpotifyAuthError,
} from "@/lib/spotify";
import type { SpotifyTrack } from "@/lib/spotify";
import {
  initiateSpotifyAuth,
  handleOAuthCallback,
  getStoredToken,
  getValidToken,
  hasClientId,
  isAuthenticated,
  clearAuth,
} from "@/lib/spotifyAuth";

type Track = SpotifyTrack;

// ── Theme ──────────────────────────────────────────────────────────────────────
const LIGHT = {
  bg: "#FBF9F6",
  bgCard: "#FFFCF9",
  bgSidebar: "#F5F1EC",
  bgInput: "#F0EBE6",
  bgChip: "transparent",
  bgChipActive: "#C1614F",
  bgButton: "#FFFFFF",
  text: "#2C2420",
  textMuted: "#8A7E79",
  textLabel: "#B0A49E",
  textChip: "#3D3530",
  textChipActive: "white",
  border: "#DDD7D1",
  borderInput: "#E2DAD4",
  accent: "#C1614F",
  accentHover: "#A0503F",
  green: "#1DB954",
  badgeBg: "#EDF7ED",
  badgeBorder: "#A5D6A7",
  badgeText: "#2E7D32",
  drawerBg: "#FFFCF9",
  shadow: "0 2px 8px rgba(44,36,32,0.07)",
  focusRing: "rgba(193,97,79,0.12)",
};
const DARK = {
  bg: "#0F0F0E",
  bgCard: "#1A1918",
  bgSidebar: "#141312",
  bgInput: "#252220",
  bgChip: "transparent",
  bgChipActive: "#1DB954",
  bgButton: "#1E1C1A",
  text: "#EDE8E2",
  textMuted: "#68635E",
  textLabel: "#504A46",
  textChip: "#C4BEB8",
  textChipActive: "#0F0F0E",
  border: "#2C2824",
  borderInput: "#342E2A",
  accent: "#1DB954",
  accentHover: "#17A348",
  green: "#1DB954",
  badgeBg: "#0C1F12",
  badgeBorder: "#1A4728",
  badgeText: "#4ADE80",
  drawerBg: "#1A1918",
  shadow: "0 2px 12px rgba(0,0,0,0.4)",
  focusRing: "rgba(29,185,84,0.18)",
};

type Theme = typeof LIGHT;

const GENRES = ["Pop", "Rock", "Hip-Hop", "Indie", "R&B", "Jazz"];
const LANGUAGES = ["All", "English", "Hindi", "Spanish", "Japanese"];
const OBSCURITY_LABELS = ["Familiar", "A Bit Niche", "Hidden Gems"];
const TRANSPARENT_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const PAGE_SIZE = 10;

// ── Audio singleton ────────────────────────────────────────────────────────────
let _audio: HTMLAudioElement | null = null;
let _fadeTimer: ReturnType<typeof setInterval> | null = null;

function playAudioPreview(url: string) {
  if (_fadeTimer) {
    clearInterval(_fadeTimer);
    _fadeTimer = null;
  }
  if (_audio) {
    _audio.pause();
    _audio = null;
  }
  const audio = new Audio(url);
  audio.volume = 0;
  _audio = audio;
  audio.play().catch(() => {});
  let vol = 0;
  _fadeTimer = setInterval(() => {
    vol = Math.min(vol + 0.07, 0.72);
    if (_audio === audio) audio.volume = vol;
    if (vol >= 0.72) {
      clearInterval(_fadeTimer!);
      _fadeTimer = null;
    }
  }, 45);
}

function stopAudioPreview() {
  if (_fadeTimer) {
    clearInterval(_fadeTimer);
    _fadeTimer = null;
  }
  const audio = _audio;
  if (!audio) return;
  let vol = audio.volume;
  _fadeTimer = setInterval(() => {
    vol = Math.max(vol - 0.07, 0);
    audio.volume = vol;
    if (vol <= 0) {
      clearInterval(_fadeTimer!);
      _fadeTimer = null;
      audio.pause();
      if (_audio === audio) _audio = null;
    }
  }, 45);
}

// ── SongCard ──────────────────────────────────────────────────────────────────
function SongCard({
  song,
  C,
  onHeard,
  onAdd,
}: {
  song: Track;
  C: Theme;
  onHeard: () => void;
  onAdd: () => void;
}) {
  const [added, setAdded] = useState(false);
  const [playing, setPlaying] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAdded(true);
    onAdd();
    setTimeout(() => setAdded(false), 2000);
  };

  const handleHeard = (e: React.MouseEvent) => {
    e.stopPropagation();
    stopAudioPreview();
    setPlaying(false);
    onHeard();
  };

  const handleMouseEnter = () => {
    if (song.previewUrl) {
      playAudioPreview(song.previewUrl);
      setPlaying(true);
    }
  };

  const handleMouseLeave = () => {
    stopAudioPreview();
    setPlaying(false);
  };

  return (
    <div
      className="flex flex-col group"
      style={{
        background: C.bgCard,
        borderRadius: "12px",
        boxShadow: C.shadow,
        outline: `1px solid ${C.border}`,
        overflow: "hidden",
        cursor: song.previewUrl ? "pointer" : "default",
        transition: "background 0.3s, outline 0.3s",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="relative"
        style={{ aspectRatio: "1 / 1", background: song.gradient }}
      >
        <img
          src={song.albumArt ?? TRANSPARENT_PIXEL}
          alt={`${song.title} album art`}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ display: song.albumArt ? "block" : "none" }}
        />
        <button
          onClick={handleHeard}
          title="Already heard it"
          className="absolute top-2 right-2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-150 hover:scale-110 active:scale-95"
          style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: "rgba(251,249,246,0.90)",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(44,36,32,0.12)",
            color: "#8A7E79",
            fontSize: 12,
            boxShadow: "0 1px 4px rgba(44,36,32,0.14)",
          }}
        >
          ✓
        </button>
        {song.previewUrl && (
          <div
            className="absolute bottom-2 left-2 transition-opacity duration-200"
            style={{ opacity: playing ? 1 : 0 }}
          >
            <span
              style={{
                background: "rgba(251,249,246,0.90)",
                backdropFilter: "blur(6px)",
                borderRadius: "99px",
                padding: "2px 8px 2px 6px",
                fontSize: "0.62rem",
                fontWeight: 600,
                color: C.accent,
                letterSpacing: "0.04em",
                border: `1px solid ${C.accent}30`,
              }}
            >
              ♪ Preview
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2.5 p-3.5">
        <div>
          <div className="flex items-start gap-1.5">
            <h3
              className="font-semibold line-clamp-1 flex-1 text-[14px] leading-snug"
              style={{ color: C.text }}
              title={song.title}
            >
              {song.title}
            </h3>
            {song.spotifyUrl && (
              <a
                href={song.spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open in Spotify"
                className="flex-shrink-0 opacity-40 hover:opacity-90 transition-opacity mt-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                <SiSpotify size={13} color="#1DB954" />
              </a>
            )}
          </div>
          <p
            className="text-xs line-clamp-1 mt-0.5"
            style={{ color: C.textMuted }}
            title={song.artist}
          >
            {song.artist}
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="w-full py-2 rounded-full text-xs font-semibold transition-all duration-200"
          style={{
            backgroundColor: added ? C.accentHover : C.accent,
            color: "white",
            letterSpacing: "0.01em",
          }}
        >
          {added ? "✓ Saved!" : "+ Add to Playlist"}
        </button>
      </div>
    </div>
  );
}

function SkeletonCard({ C }: { C: Theme }) {
  return (
    <div
      style={{
        background: C.bgCard,
        borderRadius: "12px",
        outline: `1px solid ${C.border}`,
        overflow: "hidden",
        transition: "background 0.3s",
      }}
    >
      <div
        style={{ aspectRatio: "1/1", background: C.bgInput }}
        className="animate-pulse"
      />
      <div className="p-3.5 flex flex-col gap-2.5">
        <div
          className="h-3.5 w-3/4 rounded-full animate-pulse"
          style={{ background: C.border }}
        />
        <div
          className="h-3 w-1/2 rounded-full animate-pulse"
          style={{ background: C.border }}
        />
        <div
          className="h-8 w-full rounded-full animate-pulse mt-0.5"
          style={{ background: C.border }}
        />
      </div>
    </div>
  );
}

// ── Playlist Drawer ───────────────────────────────────────────────────────────
function PlaylistDrawer({
  open,
  C,
  tracks,
  oauthToken,
  onClose,
  onRemove,
}: {
  open: boolean;
  C: Theme;
  tracks: Track[];
  oauthToken: string | null;
  onClose: () => void;
  onRemove: (i: number) => void;
}) {
  const [exporting, setExporting] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [exportErr, setExportErr] = useState<string | null>(null);

  const handleExport = async () => {
    // ✅ FIX: Always resolve a fresh token at export time via getValidToken(),
    // never rely on the oauthToken prop which may be a stale snapshot.
    const token = await getValidToken();
    if (!token) {
      setExportErr("Connect Spotify to export your playlist.");
      return;
    }
    if (tracks.length === 0) {
      setExportErr("Add some tracks first!");
      return;
    }
    setExporting(true);
    setExportErr(null);
    setExportUrl(null);
    try {
      const userId = await getCurrentUserId(token);
      const date = new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const { id, url } = await createSpotifyPlaylist(
        token,
        userId,
        `Niche Finds – ${date}`,
      );
      const uris = tracks.filter((t) => t.spotifyUri).map((t) => t.spotifyUri!);
      if (uris.length > 0) await addTracksToPlaylist(token, id, uris);
      setExportUrl(url);
    } catch (e) {
      setExportErr(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40"
            style={{
              background: "rgba(0,0,0,0.35)",
              backdropFilter: "blur(2px)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-0 right-0 h-full z-50 flex flex-col"
            style={{
              width: 340,
              background: C.drawerBg,
              boxShadow: "-4px 0 32px rgba(0,0,0,0.18)",
              borderLeft: `1px solid ${C.border}`,
              transition: "background 0.3s",
            }}
            initial={{ x: 340 }}
            animate={{ x: 0 }}
            exit={{ x: 340 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: `1px solid ${C.border}` }}
            >
              <div>
                <p
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontStyle: "italic",
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: C.text,
                  }}
                >
                  My Saved Discoveries
                </p>
                <p
                  style={{
                    fontSize: "0.72rem",
                    color: C.textMuted,
                    marginTop: 2,
                  }}
                >
                  {tracks.length} track{tracks.length !== 1 ? "s" : ""} saved
                </p>
              </div>
              <button
                onClick={onClose}
                className="flex items-center justify-center hover:opacity-60 transition-opacity"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: C.bgInput,
                  border: `1px solid ${C.border}`,
                  color: C.textMuted,
                  fontSize: 14,
                }}
              >
                ×
              </button>
            </div>
            <div
              className="flex-1 overflow-y-auto"
              style={{
                padding: "12px 16px",
                gap: 8,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {tracks.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center h-full gap-3 text-center"
                  style={{ padding: "40px 24px" }}
                >
                  <p style={{ fontSize: "2rem" }}>♪</p>
                  <p
                    style={{
                      color: C.textMuted,
                      fontSize: "0.85rem",
                      lineHeight: 1.5,
                    }}
                  >
                    Your saved discoveries will appear here. Hit "+ Add to
                    Playlist" on any card.
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                  {tracks.map((t, i) => (
                    <motion.div
                      key={`${t.spotifyId ?? t.title}-${i}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.18 }}
                      className="flex items-center gap-3 rounded-xl p-2 group"
                      style={{
                        background: C.bgInput,
                        outline: `1px solid ${C.border}`,
                      }}
                    >
                      <div
                        className="flex-shrink-0"
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 8,
                          overflow: "hidden",
                          background: t.gradient,
                        }}
                      >
                        {t.albumArt && (
                          <img
                            src={t.albumArt}
                            alt={t.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-xs font-semibold line-clamp-1"
                          style={{ color: C.text }}
                        >
                          {t.title}
                        </p>
                        <p
                          className="text-xs line-clamp-1 mt-0.5"
                          style={{ color: C.textMuted }}
                        >
                          {t.artist}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {t.spotifyUrl && (
                          <a
                            href={t.spotifyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="opacity-40 hover:opacity-90 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <SiSpotify size={13} color="#1DB954" />
                          </a>
                        )}
                        <button
                          onClick={() => onRemove(i)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                          style={{
                            color: C.textMuted,
                            fontSize: 14,
                            lineHeight: 1,
                            width: 20,
                            height: 20,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          ×
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
            <div
              className="px-4 py-4"
              style={{ borderTop: `1px solid ${C.border}` }}
            >
              {exportErr && (
                <p
                  style={{
                    color: "#E65100",
                    fontSize: "0.72rem",
                    marginBottom: 8,
                    textAlign: "center",
                  }}
                >
                  {exportErr}
                </p>
              )}
              {exportUrl ? (
                <a
                  href={exportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-full font-semibold text-sm transition-all hover:brightness-110"
                  style={{
                    background: "#1DB954",
                    color: "white",
                    textDecoration: "none",
                    boxShadow: "0 2px 12px rgba(29,185,84,0.32)",
                  }}
                >
                  <SiSpotify size={16} /> Open Playlist in Spotify
                </a>
              ) : (
                <button
                  onClick={handleExport}
                  disabled={exporting || tracks.length === 0}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-full font-semibold text-sm transition-all hover:brightness-110 disabled:opacity-40"
                  style={{
                    background: "#1DB954",
                    color: "white",
                    boxShadow: "0 2px 12px rgba(29,185,84,0.32)",
                  }}
                >
                  <SiSpotify size={16} />
                  {exporting ? "Exporting…" : "Export to Spotify"}
                </button>
              )}
              {!oauthToken && (
                <p
                  style={{
                    color: C.textMuted,
                    fontSize: "0.68rem",
                    textAlign: "center",
                    marginTop: 8,
                  }}
                >
                  Connect Spotify above to enable export
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Home ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const [darkMode, setDarkMode] = useState(false);
  const [oauthToken, setOauthToken] = useState<string | null>(() =>
    getStoredToken(),
  );
  const [oauthAuthed, setOauthAuthed] = useState(() => isAuthenticated());
  const [activeGenre, setActiveGenre] = useState("Pop");
  const [obscurity, setObscurity] = useState(0);
  const [customGenre, setCustomGenre] = useState("");
  const [language, setLanguage] = useState("All");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [gridStatus, setGridStatus] = useState<
    "not-connected" | "empty" | "error" | null
  >(null);
  const [usingLiveApi, setUsingLiveApi] = useState(false);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ✅ FIX: Track whether the OAuth callback has been handled in this session.
  // Using a ref (not state) so it never triggers a re-render.
  const callbackHandled = useRef(false);

  // ✅ FIX: Track whether oauthAuthed just flipped true so we can trigger
  // one immediate fetch without adding oauthAuthed to the filter useEffect deps.
  const prevAuthed = useRef(false);

  const C: Theme = darkMode ? DARK : LIGHT;

  // ── fetchTracks ────────────────────────────────────────────────────────────
  // ✅ FIX: useCallback deps are now [] (stable forever).
  // Token is resolved INSIDE the function via getValidToken() at call-time,
  // never closed over from stale state. This breaks the race condition where
  // oauthToken/oauthAuthed hadn't updated yet when the effect fired.
  const fetchTracks = useCallback(
    async (genre: string, level: number, lang: string, offset = 0) => {
      setTracks([]);
      setApiError(null);
      setGridStatus(null);

      // Always resolve the freshest possible token right now, not from closure
      const token = await getValidToken();

      if (!token) {
        setUsingLiveApi(false);
        setGridStatus("not-connected");
        return;
      }

      // Keep UI state in sync with whatever token we actually resolved
      setOauthToken(token);

      setLoading(true);
      try {
        const langParam = lang === "All" ? "" : lang;
        const pool = await fetchSpotifyPool(
          genre,
          level,
          token,
          langParam,
          offset,
        );

        if (pool.length === 0) {
          setGridStatus("empty");
          setUsingLiveApi(false);
        } else {
          setTracks(pool.slice(0, PAGE_SIZE));
          setUsingLiveApi(true);
          setGridStatus(null);
        }
      } catch (err) {
        if (err instanceof SpotifyAuthError) {
          // ✅ FIX: Only clear auth on a hard Spotify rejection of a real API
          // call, never during the OAuth handshake (which happens before this
          // code path is ever reached).
          console.warn(
            "[niche] Spotify rejected token (401/403) — clearing auth.",
          );
          clearAuth();
          setOauthToken(null);
          setOauthAuthed(false);
          setUsingLiveApi(false);
          setGridStatus("not-connected");
        } else {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("[niche] Spotify API error:", msg);
          setApiError(msg);
          setUsingLiveApi(false);
          setGridStatus("error");
        }
      } finally {
        setLoading(false);
      }
    },
    // ✅ Stable — no token/auth deps. getValidToken() reads localStorage fresh each call.
    [],
  );

  // ── OAuth callback handler ─────────────────────────────────────────────────
  // ✅ FIX: We no longer clean the URL *before* the async exchange completes.
  // The old code did replaceState inside the .then() which raced with React's
  // re-render. Now we clean the URL only after tokens are saved, and we update
  // auth state *before* triggering any fetch.
  useEffect(() => {
    if (callbackHandled.current) return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) return;

    callbackHandled.current = true;

    handleOAuthCallback(code).then((token) => {
      // Clean up the URL first so a page refresh doesn't re-attempt the exchange
      window.history.replaceState({}, "", window.location.pathname);

      if (token) {
        // Set both pieces of auth state together. The prevAuthed effect below
        // will see oauthAuthed flip from false→true and trigger the first fetch.
        setOauthToken(token);
        setOauthAuthed(true);
      }
    });
  }, []);

  // ── Trigger first fetch after OAuth login ──────────────────────────────────
  // ✅ FIX: A dedicated effect watches for oauthAuthed flipping true and fires
  // exactly one fetch. This decouples "just logged in" from the filter-change
  // effect below, preventing the double-fetch race.
  useEffect(() => {
    if (oauthAuthed && !prevAuthed.current) {
      prevAuthed.current = true;
      const genreKey = customGenre.trim() || activeGenre;
      fetchTracks(genreKey, obscurity, language, 0);
    }
    if (!oauthAuthed) {
      prevAuthed.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oauthAuthed]);

  // ── Re-fetch on filter changes ─────────────────────────────────────────────
  // ✅ FIX: fetchTracks is now stable ([] deps) so it's safe to omit from this
  // array. We also no longer include oauthToken/oauthAuthed here — token
  // resolution is handled inside fetchTracks itself.
  useEffect(() => {
    const genreKey = customGenre.trim() || activeGenre;
    fetchTracks(genreKey, obscurity, language, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGenre, obscurity, customGenre, language]);

  // ── "Get Fresh Set" ────────────────────────────────────────────────────────
  const getFreshSet = () => {
    const genreKey = customGenre.trim() || activeGenre;
    const offset = Math.floor(Math.random() * 35);
    fetchTracks(genreKey, obscurity, language, offset);
  };

  const markHeard = (heardTrack: Track) => {
    setTracks((prev) => prev.filter((t) => t !== heardTrack));
  };

  const handleConnect = async () => {
    if (!hasClientId()) {
      alert("VITE_SPOTIFY_CLIENT_ID is not configured.");
      return;
    }
    try {
      await initiateSpotifyAuth();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDisconnect = () => {
    clearAuth();
    setOauthToken(null);
    setOauthAuthed(false);
    // Show the not-connected empty state immediately on disconnect
    setTracks([]);
    setGridStatus("not-connected");
  };

  const handleSurprise = () => {
    setActiveGenre(GENRES[Math.floor(Math.random() * GENRES.length)]);
    setObscurity(Math.floor(Math.random() * 3));
    setCustomGenre("");
    setLanguage("All");
  };

  const addToPlaylist = (track: Track) => {
    setPlaylist((prev) =>
      prev.some(
        (t) => t.spotifyId === track.spotifyId && t.title === track.title,
      )
        ? prev
        : [...prev, track],
    );
  };

  const displayGenre = customGenre.trim() || activeGenre;

  return (
    <div
      className="min-h-[100dvh] w-full"
      style={{
        background: C.bg,
        fontFamily: "'Inter', sans-serif",
        transition: "background 0.35s, color 0.35s",
      }}
    >
      <PlaylistDrawer
        open={drawerOpen}
        C={C}
        tracks={playlist}
        oauthToken={oauthToken}
        onClose={() => setDrawerOpen(false)}
        onRemove={(i) =>
          setPlaylist((prev) => prev.filter((_, idx) => idx !== i))
        }
      />

      <div className="max-w-[1280px] mx-auto px-6 py-10 md:py-14 flex flex-col md:flex-row gap-10 md:gap-14">
        {/* ── Left Panel ── */}
        <aside className="w-full md:w-[300px] flex-shrink-0 flex flex-col gap-7">
          {/* Brand + dark mode toggle */}
          <div className="flex items-start justify-between">
            <div>
              <h1
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "3rem",
                  fontWeight: 700,
                  fontStyle: "italic",
                  lineHeight: 1,
                  color: C.text,
                  letterSpacing: "-0.035em",
                  transition: "color 0.35s",
                }}
              >
                niche
              </h1>
              <p
                style={{
                  color: C.textMuted,
                  marginTop: 6,
                  fontSize: "0.85rem",
                  lineHeight: 1.5,
                  transition: "color 0.35s",
                }}
              >
                Music made for you, not the algorithm.
              </p>
            </div>
            <button
              onClick={() => setDarkMode((d) => !d)}
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              className="flex-shrink-0 mt-1 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: C.bgInput,
                border: `1.5px solid ${C.border}`,
                color: C.textMuted,
                fontSize: 16,
                boxShadow: C.shadow,
                transition: "background 0.35s, border 0.35s",
              }}
            >
              {darkMode ? "☀" : "☾"}
            </button>
          </div>

          {/* Spotify connect/disconnect */}
          {oauthAuthed ? (
            <div className="flex flex-col gap-1.5">
              <div
                className="flex items-center gap-2 px-4 py-2.5 rounded-full"
                style={{
                  background: C.badgeBg,
                  border: `1.5px solid ${C.badgeBorder}`,
                }}
              >
                <SiSpotify size={15} color={C.green} />
                <span
                  style={{
                    color: C.badgeText,
                    fontSize: "0.85rem",
                    fontWeight: 500,
                  }}
                >
                  Spotify Connected
                </span>
              </div>
              <button
                onClick={handleDisconnect}
                className="text-xs underline hover:opacity-70 transition-opacity text-left"
                style={{ color: C.textLabel }}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              className="flex items-center justify-center gap-2.5 w-full py-3 rounded-full font-semibold transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
              style={{
                backgroundColor: "#1DB954",
                color: "white",
                fontSize: "0.9rem",
                boxShadow: "0 2px 12px rgba(29,185,84,0.28)",
              }}
            >
              <SiSpotify size={18} /> Connect Spotify
            </button>
          )}

          {/* Status banners */}
          {usingLiveApi && !oauthAuthed && (
            <div
              style={{
                background: C.badgeBg,
                border: `1px solid ${C.badgeBorder}`,
                borderRadius: 8,
                padding: "7px 12px",
                transition: "background 0.35s",
              }}
            >
              <p
                style={{
                  color: C.badgeText,
                  fontSize: "0.72rem",
                  fontWeight: 500,
                }}
              >
                ✓ Live Spotify data active
              </p>
            </div>
          )}
          {apiError && (
            <div
              style={{
                background: "#FFF3E0",
                border: "1px solid #FFCC80",
                borderRadius: 8,
                padding: "7px 12px",
              }}
            >
              <p style={{ color: "#E65100", fontSize: "0.72rem" }}>
                Spotify API error — check console for details
              </p>
            </div>
          )}

          {/* Genre chips */}
          <div className="flex flex-col gap-2.5">
            <p
              className="uppercase tracking-widest"
              style={{
                fontSize: "0.63rem",
                fontWeight: 600,
                color: C.textLabel,
                letterSpacing: "0.13em",
                transition: "color 0.35s",
              }}
            >
              Start with a Vibe
            </p>
            <div className="grid grid-cols-2 gap-2">
              {GENRES.map((genre) => {
                const isActive = genre === activeGenre && !customGenre.trim();
                return (
                  <button
                    key={genre}
                    onClick={() => {
                      setActiveGenre(genre);
                      setCustomGenre("");
                    }}
                    className="py-2 rounded-full font-medium transition-all duration-150 text-sm"
                    style={
                      isActive
                        ? {
                            backgroundColor: C.bgChipActive,
                            color: C.textChipActive,
                            border: `1.5px solid ${C.bgChipActive}`,
                            boxShadow: darkMode
                              ? "0 2px 8px rgba(29,185,84,0.24)"
                              : "0 2px 8px rgba(193,97,79,0.24)",
                          }
                        : {
                            backgroundColor: C.bgChip,
                            color: C.textChip,
                            border: `1.5px solid ${C.border}`,
                            transition:
                              "background 0.35s, border 0.35s, color 0.35s",
                          }
                    }
                  >
                    {genre}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Language chips */}
          <div className="flex flex-col gap-2.5">
            <p
              className="uppercase tracking-widest"
              style={{
                fontSize: "0.63rem",
                fontWeight: 600,
                color: C.textLabel,
                letterSpacing: "0.13em",
                transition: "color 0.35s",
              }}
            >
              Language
            </p>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => {
                const isActive = lang === language;
                return (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className="px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150"
                    style={
                      isActive
                        ? {
                            backgroundColor: C.bgChipActive,
                            color: C.textChipActive,
                            border: `1.5px solid ${C.bgChipActive}`,
                          }
                        : {
                            backgroundColor: C.bgChip,
                            color: C.textChip,
                            border: `1.5px solid ${C.border}`,
                          }
                    }
                  >
                    {lang}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom genre */}
          <div className="flex flex-col gap-2">
            <p
              className="uppercase tracking-widest"
              style={{
                fontSize: "0.63rem",
                fontWeight: 600,
                color: C.textLabel,
                letterSpacing: "0.13em",
                transition: "color 0.35s",
              }}
            >
              Or type a custom genre
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
              <input
                type="text"
                value={customGenre}
                onChange={(e) => setCustomGenre(e.target.value)}
                placeholder="e.g. Bossa Nova, Shoegaze…"
                className="flex-1 py-2.5 px-4 rounded-full text-sm outline-none"
                style={{
                  background: C.bgInput,
                  border: `1.5px solid ${C.borderInput}`,
                  color: C.text,
                  fontFamily: "'Inter', sans-serif",
                  transition: "background 0.35s, border 0.35s",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = C.accent;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${C.focusRing}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = C.borderInput;
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              {customGenre.trim() && (
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-full text-sm font-medium transition-all active:scale-95"
                  style={{ backgroundColor: C.accent, color: "white" }}
                >
                  Go
                </button>
              )}
            </form>
          </div>

          {/* Obscurity slider */}
          <div className="flex flex-col gap-2.5">
            <p
              className="uppercase tracking-widest"
              style={{
                fontSize: "0.63rem",
                fontWeight: 600,
                color: C.textLabel,
                letterSpacing: "0.13em",
                transition: "color 0.35s",
              }}
            >
              How Deep?
            </p>
            <input
              type="range"
              min="0"
              max="2"
              step="1"
              value={obscurity}
              onChange={(e) => setObscurity(Number(e.target.value))}
              className="custom-range"
              style={{
                background: `linear-gradient(to right, ${C.accent} ${(obscurity / 2) * 100}%, ${C.border} ${(obscurity / 2) * 100}%)`,
              }}
            />
            <div className="flex justify-between">
              {OBSCURITY_LABELS.map((label, i) => (
                <span
                  key={label}
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: obscurity === i ? 600 : 400,
                    color: obscurity === i ? C.accent : C.textLabel,
                    transition: "color 0.15s",
                  }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Surprise Me */}
          <button
            onClick={handleSurprise}
            className="w-full py-3 rounded-2xl font-semibold transition-all duration-150 hover:brightness-[0.97] active:scale-[0.98] text-sm"
            style={{
              background: C.bgButton,
              border: `1.5px solid ${C.border}`,
              color: C.text,
              boxShadow: C.shadow,
              letterSpacing: "0.02em",
              transition: "background 0.35s, border 0.35s, color 0.35s",
            }}
          >
            ✦ Surprise Me
          </button>
        </aside>

        {/* ── Right Panel ── */}
        <main className="flex-1 flex flex-col min-w-0">
          <div className="flex items-end justify-between mb-5 gap-4">
            <div>
              <h2
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "2.1rem",
                  fontWeight: 700,
                  color: C.text,
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                  transition: "color 0.35s",
                }}
              >
                Your Fresh Finds
              </h2>
              <p
                style={{
                  color: C.textMuted,
                  marginTop: 6,
                  fontSize: "0.9rem",
                  transition: "color 0.35s",
                }}
              >
                Digging into{" "}
                <span style={{ color: C.text, fontWeight: 600 }}>
                  {displayGenre}
                </span>{" "}
                <span style={{ color: C.accent }}>•</span>{" "}
                <span>{obscurityLabel(obscurity)}</span>
                {language !== "All" && (
                  <>
                    {" "}
                    <span style={{ color: C.accent }}>•</span>{" "}
                    <span>{language}</span>
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setDrawerOpen(true)}
                className="relative flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium transition-all hover:brightness-[0.96] active:scale-[0.97]"
                style={{
                  background: C.bgButton,
                  border: `1.5px solid ${C.border}`,
                  color: C.text,
                  boxShadow: C.shadow,
                  transition: "background 0.35s, border 0.35s",
                }}
              >
                ♪ My Playlist
                {playlist.length > 0 && (
                  <span
                    className="flex items-center justify-center text-[10px] font-bold"
                    style={{
                      background: C.accent,
                      color: "white",
                      width: 17,
                      height: 17,
                      borderRadius: "50%",
                      lineHeight: 1,
                    }}
                  >
                    {playlist.length}
                  </span>
                )}
              </button>
              <button
                onClick={getFreshSet}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all hover:brightness-[0.96] active:scale-[0.97] disabled:opacity-40"
                style={{
                  background: C.bgButton,
                  border: `1.5px solid ${C.border}`,
                  color: C.text,
                  boxShadow: C.shadow,
                  transition: "background 0.35s, border 0.35s",
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 14 14"
                  fill="none"
                  style={{ flexShrink: 0 }}
                >
                  <path
                    d="M12.5 2.5A6.5 6.5 0 1 0 13 7"
                    stroke={C.accent}
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                  <path
                    d="M10 2.5h2.5V5"
                    stroke={C.accent}
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Get Fresh Set
              </button>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <SkeletonCard key={i} C={C} />
              ))}
            </div>
          ) : gridStatus !== null ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center text-center py-24 px-8 rounded-2xl"
              style={{
                border: `1.5px dashed ${C.border}`,
                background: C.bgCard,
                minHeight: 320,
              }}
            >
              {gridStatus === "not-connected" && (
                <>
                  <p style={{ fontSize: "2.5rem", marginBottom: 12 }}>♪</p>
                  <p
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: "1.35rem",
                      fontWeight: 700,
                      fontStyle: "italic",
                      color: C.text,
                      marginBottom: 8,
                    }}
                  >
                    Connect Spotify to start listening
                  </p>
                  <p
                    style={{
                      color: C.textMuted,
                      fontSize: "0.875rem",
                      lineHeight: 1.6,
                      maxWidth: 320,
                      marginBottom: 24,
                    }}
                  >
                    Sign in with your Spotify account to fetch real tracks, hear
                    previews, and export playlists.
                  </p>
                  <button
                    onClick={handleConnect}
                    className="flex items-center gap-2.5 px-6 py-3 rounded-full font-semibold text-sm transition-all hover:brightness-110 active:scale-[0.97]"
                    style={{
                      background: "#1DB954",
                      color: "white",
                      boxShadow: "0 2px 16px rgba(29,185,84,0.32)",
                    }}
                  >
                    <SiSpotify size={18} /> Connect Spotify
                  </button>
                </>
              )}
              {gridStatus === "empty" && (
                <>
                  <p style={{ fontSize: "2rem", marginBottom: 12 }}>🔍</p>
                  <p
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: "1.2rem",
                      fontWeight: 700,
                      color: C.text,
                      marginBottom: 8,
                    }}
                  >
                    No tracks found for this combination
                  </p>
                  <p
                    style={{
                      color: C.textMuted,
                      fontSize: "0.875rem",
                      lineHeight: 1.6,
                      maxWidth: 300,
                      marginBottom: 20,
                    }}
                  >
                    Try a different genre, language, or click Get Fresh Set to
                    search a different offset.
                  </p>
                  <button
                    onClick={getFreshSet}
                    className="px-6 py-2.5 rounded-full text-sm font-semibold transition-all hover:brightness-[0.96] active:scale-[0.97]"
                    style={{
                      background: C.bgButton,
                      border: `1.5px solid ${C.border}`,
                      color: C.text,
                    }}
                  >
                    Get Fresh Set
                  </button>
                </>
              )}
              {gridStatus === "error" && (
                <>
                  <p style={{ fontSize: "2rem", marginBottom: 12 }}>⚠️</p>
                  <p
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: "1.2rem",
                      fontWeight: 700,
                      color: C.text,
                      marginBottom: 8,
                    }}
                  >
                    Spotify returned an error
                  </p>
                  <p
                    style={{
                      color: C.textMuted,
                      fontSize: "0.8rem",
                      lineHeight: 1.6,
                      maxWidth: 340,
                      marginBottom: 20,
                      wordBreak: "break-word",
                    }}
                  >
                    {apiError}
                  </p>
                  <button
                    onClick={getFreshSet}
                    className="px-6 py-2.5 rounded-full text-sm font-semibold transition-all hover:brightness-[0.96] active:scale-[0.97]"
                    style={{
                      background: C.bgButton,
                      border: `1.5px solid ${C.border}`,
                      color: C.text,
                    }}
                  >
                    Try Again
                  </button>
                </>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
              <AnimatePresence mode="popLayout">
                {tracks.map((song, idx) => (
                  <motion.div
                    key={`${song.spotifyId ?? song.title}-${song.artist}-${idx}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    transition={{
                      duration: 0.22,
                      delay: idx * 0.025,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    layout
                  >
                    <SongCard
                      song={song}
                      C={C}
                      onHeard={() => markHeard(song)}
                      onAdd={() => addToPlaylist(song)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
