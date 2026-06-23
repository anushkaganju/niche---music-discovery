import { useState, useEffect, useCallback, useRef } from "react";
import { SiSpotify } from "react-icons/si";
import { AnimatePresence, motion } from "framer-motion";
import { fetchSpotifyRecommendations, obscurityLabel } from "@/lib/spotify";
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

const SPOTIFY_TOKEN: string | undefined =
  import.meta.env.VITE_SPOTIFY_ACCESS_TOKEN || undefined;

const GENRES = ["Pop", "Rock", "Hip-Hop", "Indie", "R&B", "Jazz"];
const OBSCURITY_SLIDER_LABELS = ["Familiar", "A Bit Niche", "Hidden Gems"];
const TRANSPARENT_PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

const MARKETS = [
  { label: "Global (All)", value: "" },
  { label: "India (Hindi / Regional)", value: "IN" },
  { label: "United States / UK (English)", value: "US" },
  { label: "South Korea (K-Pop)", value: "KR" },
  { label: "Japan (J-Pop / City Pop)", value: "JP" },
  { label: "Latin America (Spanish)", value: "MX" },
];

const MOCK_DATA: Record<string, Track[]> = {
  "Pop-0": [
    { title: "Levitating", artist: "Dua Lipa", gradient: "linear-gradient(135deg,#f8b4d9 0%,#fbc8a3 100%)" },
    { title: "Blinding Lights", artist: "The Weeknd", gradient: "linear-gradient(135deg,#ffd6e7 0%,#ffb3c6 100%)" },
    { title: "Shape of You", artist: "Ed Sheeran", gradient: "linear-gradient(135deg,#ffd6a5 0%,#fdffb6 100%)" },
    { title: "As It Was", artist: "Harry Styles", gradient: "linear-gradient(135deg,#fce4ec 0%,#f8bbd0 100%)" },
    { title: "Anti-Hero", artist: "Taylor Swift", gradient: "linear-gradient(135deg,#e8f5e9 0%,#c8e6c9 100%)" },
    { title: "Stay", artist: "The Kid LAROI & Justin Bieber", gradient: "linear-gradient(135deg,#fff9c4 0%,#fff176 100%)" },
  ],
  "Pop-1": [
    { title: "Solar Power", artist: "Lorde", gradient: "linear-gradient(135deg,#caffbf 0%,#fdffb6 100%)" },
    { title: "Nightmare Dressed Like a Daydream", artist: "Maisie Peters", gradient: "linear-gradient(135deg,#e0aaff 0%,#c8b6ff 100%)" },
    { title: "Easy On Me", artist: "Adele", gradient: "linear-gradient(135deg,#ffd6e7 0%,#ffecd2 100%)" },
    { title: "Midnight Rain", artist: "Taylor Swift", gradient: "linear-gradient(135deg,#d1c4e9 0%,#b39ddb 100%)" },
    { title: "Superstar", artist: "Carpenters", gradient: "linear-gradient(135deg,#fff8e1 0%,#ffecb3 100%)" },
    { title: "2step", artist: "Ed Sheeran ft. Lil Baby", gradient: "linear-gradient(135deg,#e3f2fd 0%,#bbdefb 100%)" },
  ],
  "Pop-2": [
    { title: "Ceilings", artist: "Lizzy McAlpine", gradient: "linear-gradient(135deg,#d8f3dc 0%,#b7e4c7 100%)" },
    { title: "Stick Season", artist: "Noah Kahan", gradient: "linear-gradient(135deg,#ffe8a3 0%,#ffd166 100%)" },
    { title: "Motion Sickness", artist: "Phoebe Bridgers", gradient: "linear-gradient(135deg,#cde2f9 0%,#a9d0f5 100%)" },
    { title: "Funeral", artist: "Phoebe Bridgers", gradient: "linear-gradient(135deg,#e1bee7 0%,#ce93d8 100%)" },
    { title: "Hex Head", artist: "Arlo Parks", gradient: "linear-gradient(135deg,#fce4ec 0%,#f48fb1 100%)" },
    { title: "First Aid", artist: "Waxahatchee", gradient: "linear-gradient(135deg,#e8f5e9 0%,#a5d6a7 100%)" },
  ],
  "Rock-0": [
    { title: "Mr. Brightside", artist: "The Killers", gradient: "linear-gradient(135deg,#ff9a3c 0%,#ff6b6b 100%)" },
    { title: "Seven Nation Army", artist: "The White Stripes", gradient: "linear-gradient(135deg,#f72585 0%,#b5179e 100%)" },
    { title: "Bohemian Rhapsody", artist: "Queen", gradient: "linear-gradient(135deg,#ffd6a5 0%,#ffb347 100%)" },
    { title: "Smells Like Teen Spirit", artist: "Nirvana", gradient: "linear-gradient(135deg,#b0bec5 0%,#607d8b 100%)" },
    { title: "Eye of the Tiger", artist: "Survivor", gradient: "linear-gradient(135deg,#ffc107 0%,#ff5722 100%)" },
    { title: "Wonderwall", artist: "Oasis", gradient: "linear-gradient(135deg,#fff59d 0%,#f9a825 100%)" },
  ],
  "Rock-1": [
    { title: "Dark Side of the Gym", artist: "The National", gradient: "linear-gradient(135deg,#6a4c93 0%,#9b5de5 100%)" },
    { title: "I Will Follow You into the Dark", artist: "Death Cab for Cutie", gradient: "linear-gradient(135deg,#a8dadc 0%,#457b9d 100%)" },
    { title: "Mardy Bum", artist: "Arctic Monkeys", gradient: "linear-gradient(135deg,#f4a261 0%,#e76f51 100%)" },
    { title: "The Less I Know the Better", artist: "Tame Impala", gradient: "linear-gradient(135deg,#c77dff 0%,#7b2ff7 100%)" },
    { title: "Pink Moon", artist: "Nick Drake", gradient: "linear-gradient(135deg,#ffe0b2 0%,#ffcc80 100%)" },
    { title: "505", artist: "Arctic Monkeys", gradient: "linear-gradient(135deg,#546e7a 0%,#37474f 100%)" },
  ],
  "Rock-2": [
    { title: "This Is the Last Time", artist: "The National", gradient: "linear-gradient(135deg,#264653 0%,#2a9d8f 100%)" },
    { title: "Obstacles", artist: "Syd Matters", gradient: "linear-gradient(135deg,#caf0f8 0%,#90e0ef 100%)" },
    { title: "Lua", artist: "Bright Eyes", gradient: "linear-gradient(135deg,#ffecd2 0%,#fcb69f 100%)" },
    { title: "Fourth of July", artist: "Sufjan Stevens", gradient: "linear-gradient(135deg,#e8eaf6 0%,#9fa8da 100%)" },
    { title: "Have One on Me", artist: "Joanna Newsom", gradient: "linear-gradient(135deg,#fff8e1 0%,#ffe082 100%)" },
    { title: "Casimir Pulaski Day", artist: "Sufjan Stevens", gradient: "linear-gradient(135deg,#e3f2fd 0%,#90caf9 100%)" },
  ],
  "Hip-Hop-0": [
    { title: "God's Plan", artist: "Drake", gradient: "linear-gradient(135deg,#ffe57f 0%,#ffca28 100%)" },
    { title: "HUMBLE.", artist: "Kendrick Lamar", gradient: "linear-gradient(135deg,#d62828 0%,#f77f00 100%)" },
    { title: "Sicko Mode", artist: "Travis Scott", gradient: "linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)" },
    { title: "Not Like Us", artist: "Kendrick Lamar", gradient: "linear-gradient(135deg,#1b5e20 0%,#2e7d32 100%)" },
    { title: "Rich Flex", artist: "Drake & 21 Savage", gradient: "linear-gradient(135deg,#212121 0%,#424242 100%)" },
    { title: "Essence", artist: "Wizkid ft. Tems", gradient: "linear-gradient(135deg,#f57f17 0%,#ffa000 100%)" },
  ],
  "Hip-Hop-1": [
    { title: "Nikes", artist: "Frank Ocean", gradient: "linear-gradient(135deg,#48cae4 0%,#0077b6 100%)" },
    { title: "PRIDE.", artist: "Kendrick Lamar", gradient: "linear-gradient(135deg,#f8b4d9 0%,#c77dff 100%)" },
    { title: "Waves", artist: "Mac Miller", gradient: "linear-gradient(135deg,#74c69d 0%,#40916c 100%)" },
    { title: "Self Control", artist: "Frank Ocean", gradient: "linear-gradient(135deg,#b2ebf2 0%,#80deea 100%)" },
    { title: "2009", artist: "Mac Miller", gradient: "linear-gradient(135deg,#e8f5e9 0%,#81c784 100%)" },
    { title: "Programs", artist: "Saba", gradient: "linear-gradient(135deg,#ede7f6 0%,#b39ddb 100%)" },
  ],
  "Hip-Hop-2": [
    { title: "Braindrops", artist: "Pink Siifu", gradient: "linear-gradient(135deg,#4a4e69 0%,#9a8c98 100%)" },
    { title: "Swerve City", artist: "Doomtree", gradient: "linear-gradient(135deg,#e2b96f 0%,#c8843e 100%)" },
    { title: "Westside Bound 3", artist: "Your Old Droog", gradient: "linear-gradient(135deg,#90a955 0%,#4f772d 100%)" },
    { title: "Wool", artist: "billy woods", gradient: "linear-gradient(135deg,#5d4037 0%,#4e342e 100%)" },
    { title: "Drift", artist: "Injury Reserve", gradient: "linear-gradient(135deg,#37474f 0%,#263238 100%)" },
    { title: "Simple Simon", artist: "Milo", gradient: "linear-gradient(135deg,#efebe9 0%,#d7ccc8 100%)" },
  ],
  "Indie-0": [
    { title: "Electric Feel", artist: "MGMT", gradient: "linear-gradient(135deg,#7400b8 0%,#6930c3 100%)" },
    { title: "Take Me Out", artist: "Franz Ferdinand", gradient: "linear-gradient(135deg,#f72585 0%,#560bad 100%)" },
    { title: "Dog Days Are Over", artist: "Florence + The Machine", gradient: "linear-gradient(135deg,#f4d35e 0%,#ee964b 100%)" },
    { title: "Ho Hey", artist: "The Lumineers", gradient: "linear-gradient(135deg,#fff176 0%,#ffd54f 100%)" },
    { title: "Little Talks", artist: "Of Monsters and Men", gradient: "linear-gradient(135deg,#b3e5fc 0%,#81d4fa 100%)" },
    { title: "Tongue Tied", artist: "Grouplove", gradient: "linear-gradient(135deg,#f48fb1 0%,#f06292 100%)" },
  ],
  "Indie-1": [
    { title: "Georgia", artist: "Benson Boone", gradient: "linear-gradient(135deg,#e2d9f3 0%,#b5a8d8 100%)" },
    { title: "In My Arms", artist: "Maisie Peters", gradient: "linear-gradient(135deg,#ffccd5 0%,#ff85a1 100%)" },
    { title: "Punisher", artist: "Phoebe Bridgers", gradient: "linear-gradient(135deg,#d4e09b 0%,#a7c957 100%)" },
    { title: "First Day of My Life", artist: "Bright Eyes", gradient: "linear-gradient(135deg,#ffe0b2 0%,#ffcc80 100%)" },
    { title: "Ribs", artist: "Lorde", gradient: "linear-gradient(135deg,#e8eaf6 0%,#c5cae9 100%)" },
    { title: "You Are the Best Thing", artist: "Ray LaMontagne", gradient: "linear-gradient(135deg,#f9fbe7 0%,#f0f4c3 100%)" },
  ],
  "Indie-2": [
    { title: "Stranger", artist: "Jordana", gradient: "linear-gradient(135deg,#f7cad0 0%,#ffe8d6 100%)" },
    { title: "Ivy", artist: "Frank Ocean", gradient: "linear-gradient(135deg,#a8e6cf 0%,#dcedc1 100%)" },
    { title: "Savior Complex", artist: "Phoebe Bridgers", gradient: "linear-gradient(135deg,#c3b1e1 0%,#e8d5f5 100%)" },
    { title: "Honey", artist: "Hovvdy", gradient: "linear-gradient(135deg,#fff9c4 0%,#fff59d 100%)" },
    { title: "Clarity", artist: "Raveena", gradient: "linear-gradient(135deg,#fce4ec 0%,#f8bbd0 100%)" },
    { title: "Devotion", artist: "Hurray for the Riff Raff", gradient: "linear-gradient(135deg,#e8f5e9 0%,#c8e6c9 100%)" },
  ],
  "R&B-0": [
    { title: "Essence", artist: "Wizkid ft. Tems", gradient: "linear-gradient(135deg,#f4845f 0%,#f2614a 100%)" },
    { title: "Leave the Door Open", artist: "Bruno Mars & Anderson Paak", gradient: "linear-gradient(135deg,#ffb347 0%,#ff8c00 100%)" },
    { title: "Good Days", artist: "SZA", gradient: "linear-gradient(135deg,#c9ada7 0%,#9a8c98 100%)" },
    { title: "Golden Hour", artist: "JVKE", gradient: "linear-gradient(135deg,#ffd180 0%,#ffab40 100%)" },
    { title: "Kill Bill", artist: "SZA", gradient: "linear-gradient(135deg,#ff8a80 0%,#ff5252 100%)" },
    { title: "Peaches", artist: "Justin Bieber ft. Daniel Caesar", gradient: "linear-gradient(135deg,#ffa726 0%,#fb8c00 100%)" },
  ],
  "R&B-1": [
    { title: "Hurt Me", artist: "Snoh Aalegra", gradient: "linear-gradient(135deg,#f2cdcd 0%,#e0a0b0 100%)" },
    { title: "How Will I Know", artist: "Sam Smith", gradient: "linear-gradient(135deg,#ffe8d6 0%,#f8c8a0 100%)" },
    { title: "On and On", artist: "Erykah Badu", gradient: "linear-gradient(135deg,#fbb1bd 0%,#ee82ee 100%)" },
    { title: "Make Me Feel", artist: "Janelle Monae", gradient: "linear-gradient(135deg,#ea80fc 0%,#e040fb 100%)" },
    { title: "Look What You're Doing to Me", artist: "Snoh Aalegra ft. A$AP Rocky", gradient: "linear-gradient(135deg,#f3e5f5 0%,#e1bee7 100%)" },
    { title: "Bloom", artist: "Troye Sivan", gradient: "linear-gradient(135deg,#fce4ec 0%,#f48fb1 100%)" },
  ],
  "R&B-2": [
    { title: "Do You Feel Me", artist: "Kadhja Bonet", gradient: "linear-gradient(135deg,#b5838d 0%,#e5989b 100%)" },
    { title: "Bed", artist: "Anaiis", gradient: "linear-gradient(135deg,#6d6875 0%,#b5838d 100%)" },
    { title: "Cranes in the Sky", artist: "Solange", gradient: "linear-gradient(135deg,#ffb4a2 0%,#e5989b 100%)" },
    { title: "If You're Reading This It's Too Late", artist: "Charlotte OC", gradient: "linear-gradient(135deg,#d7bde2 0%,#bb8fce 100%)" },
    { title: "Free Mind", artist: "Tems", gradient: "linear-gradient(135deg,#a9dfbf 0%,#76b041 100%)" },
    { title: "Superposition", artist: "Young Fathers", gradient: "linear-gradient(135deg,#fdfd96 0%,#ffd700 100%)" },
  ],
  "Jazz-0": [
    { title: "So What", artist: "Miles Davis", gradient: "linear-gradient(135deg,#023e8a 0%,#0077b6 100%)" },
    { title: "Take Five", artist: "Dave Brubeck", gradient: "linear-gradient(135deg,#1b4332 0%,#2d6a4f 100%)" },
    { title: "Round Midnight", artist: "Thelonious Monk", gradient: "linear-gradient(135deg,#10002b 0%,#240046 100%)" },
    { title: "Autumn Leaves", artist: "Bill Evans", gradient: "linear-gradient(135deg,#bc6c25 0%,#dda15e 100%)" },
    { title: "My Favorite Things", artist: "John Coltrane", gradient: "linear-gradient(135deg,#e8f5e9 0%,#a5d6a7 100%)" },
    { title: "Fly Me to the Moon", artist: "Frank Sinatra", gradient: "linear-gradient(135deg,#e3f2fd 0%,#90caf9 100%)" },
  ],
  "Jazz-1": [
    { title: "Autumn Leaves", artist: "Bill Evans Trio", gradient: "linear-gradient(135deg,#bc6c25 0%,#dda15e 100%)" },
    { title: "Sea of Tranquility", artist: "Cecile McLorin Salvant", gradient: "linear-gradient(135deg,#7a9e7e 0%,#b9d4aa 100%)" },
    { title: "Everything Is Moving So Fast", artist: "GoGo Penguin", gradient: "linear-gradient(135deg,#3c1642 0%,#086375 100%)" },
    { title: "Celia", artist: "Cécile McLorin Salvant", gradient: "linear-gradient(135deg,#f5cba7 0%,#e59866 100%)" },
    { title: "The Star of a Story", artist: "GoGo Penguin", gradient: "linear-gradient(135deg,#2e86c1 0%,#1a5276 100%)" },
    { title: "Maiden Voyage", artist: "Herbie Hancock", gradient: "linear-gradient(135deg,#48c9b0 0%,#1abc9c 100%)" },
  ],
  "Jazz-2": [
    { title: "Nardis", artist: "Ahmad Jamal", gradient: "linear-gradient(135deg,#4b3832 0%,#be9b7b 100%)" },
    { title: "Umi Says", artist: "Mos Def", gradient: "linear-gradient(135deg,#2a4858 0%,#4b8b9e 100%)" },
    { title: "Spiral", artist: "Shabaka and The Ancestors", gradient: "linear-gradient(135deg,#1a1a1a 0%,#4a4a6a 100%)" },
    { title: "Angel Bat Dawid", artist: "The Oracle", gradient: "linear-gradient(135deg,#3d0c02 0%,#6d1a0a 100%)" },
    { title: "Planetarium", artist: "Kamaal Williams", gradient: "linear-gradient(135deg,#0d0d2b 0%,#1a1a4e 100%)" },
    { title: "Afro Blue", artist: "Erykah Badu", gradient: "linear-gradient(135deg,#1c3144 0%,#2e4057 100%)" },
  ],
};

function SongCard({ song }: { song: Track }) {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div
      className="flex flex-col"
      style={{
        background: "#FFFCF9",
        borderRadius: "12px",
        boxShadow: "0px 2px 8px 0px rgba(44,36,32,0.07), 0px 0px 0px 1px rgba(44,36,32,0.05)",
        overflow: "hidden",
      }}
    >
      <div
        className="relative gradient-art"
        style={{ aspectRatio: "1 / 1", background: song.gradient }}
      >
        <img
          src={song.albumArt ?? TRANSPARENT_PIXEL}
          alt={`${song.title} album art`}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ display: song.albumArt ? "block" : "none" }}
        />
      </div>
      <div className="flex flex-col gap-3 p-4">
        <div>
          <h3
            className="font-semibold line-clamp-1 text-[15px] leading-snug"
            style={{ color: "#2C2420" }}
            title={song.title}
          >
            {song.title}
          </h3>
          <p className="text-sm line-clamp-1 mt-0.5" style={{ color: "#8A7E79" }} title={song.artist}>
            {song.artist}
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="w-full py-2.5 rounded-full text-sm font-medium transition-all duration-200"
          style={{
            backgroundColor: added ? "#A0503F" : "#C1614F",
            color: "white",
            letterSpacing: "0.01em",
          }}
        >
          {added ? "✓ Added!" : "+ Add to Playlist"}
        </button>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div
      style={{
        background: "#FFFCF9",
        borderRadius: "12px",
        boxShadow: "0px 2px 8px 0px rgba(44,36,32,0.07), 0px 0px 0px 1px rgba(44,36,32,0.05)",
        overflow: "hidden",
      }}
    >
      <div style={{ aspectRatio: "1/1", background: "linear-gradient(135deg,#f0ebe6 0%,#e8e0d8 100%)" }} className="animate-pulse" />
      <div className="p-4 flex flex-col gap-3">
        <div>
          <div className="h-4 w-3/4 rounded-full animate-pulse" style={{ background: "#EDE7E1" }} />
          <div className="h-3 w-1/2 rounded-full animate-pulse mt-2" style={{ background: "#F0EBE6" }} />
        </div>
        <div className="h-9 w-full rounded-full animate-pulse" style={{ background: "#F0EBE6" }} />
      </div>
    </div>
  );
}

export default function Home() {
  const [oauthToken, setOauthToken]     = useState<string | null>(() => getStoredToken());
  const [oauthAuthed, setOauthAuthed]   = useState(() => isAuthenticated());
  const [activeGenre, setActiveGenre]   = useState("Pop");
  const [obscurity, setObscurity]       = useState(0);
  const [customGenre, setCustomGenre]   = useState("");
  const [market, setMarket]             = useState("US");
  const [tracks, setTracks]             = useState<Track[]>(MOCK_DATA["Pop-0"]);
  const [loading, setLoading]           = useState(false);
  const [apiError, setApiError]         = useState<string | null>(null);
  const [usingLiveApi, setUsingLiveApi] = useState(false);
  const callbackHandled = useRef(false);

  const activeToken = oauthToken ?? SPOTIFY_TOKEN;

  useEffect(() => {
    if (callbackHandled.current) return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) return;
    callbackHandled.current = true;

    handleOAuthCallback(code).then(token => {
      if (token) {
        setOauthToken(token);
        setOauthAuthed(true);
      }
      window.history.replaceState({}, "", window.location.pathname);
    });
  }, []);

  const loadTracks = useCallback(async (genre: string, level: number, mkt: string) => {
    const mockKey = `${genre}-${level}`;
    const mockFallback = MOCK_DATA[mockKey] ?? MOCK_DATA["Pop-0"];

    let token = activeToken;

    if (oauthAuthed) {
      const refreshed = await getValidToken();
      if (refreshed) {
        token = refreshed;
        setOauthToken(refreshed);
      }
    }

    if (!token) {
      setTracks(mockFallback);
      setUsingLiveApi(false);
      setApiError(null);
      return;
    }

    setLoading(true);
    setApiError(null);
    try {
      const live = await fetchSpotifyRecommendations(genre, level, token, 6, mkt || "US");
      setTracks(live);
      setUsingLiveApi(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setApiError(msg);
      setTracks(mockFallback);
      setUsingLiveApi(false);
    } finally {
      setLoading(false);
    }
  }, [activeToken, oauthAuthed]);

  useEffect(() => {
    const genreKey = customGenre.trim() || activeGenre;
    loadTracks(genreKey, obscurity, market);
  }, [activeGenre, obscurity, customGenre, market, loadTracks]);

  const handleConnect = async () => {
    if (!hasClientId()) {
      alert("VITE_SPOTIFY_CLIENT_ID is not configured. Add it as a Replit secret to enable OAuth login.");
      return;
    }
    try {
      await initiateSpotifyAuth();
    } catch (e) {
      console.error("Auth initiation failed:", e);
    }
  };

  const handleDisconnect = () => {
    clearAuth();
    setOauthToken(null);
    setOauthAuthed(false);
  };

  const handleSurprise = () => {
    const randomGenre = GENRES[Math.floor(Math.random() * GENRES.length)];
    const randomObscurity = Math.floor(Math.random() * 3);
    setActiveGenre(randomGenre);
    setObscurity(randomObscurity);
    setCustomGenre("");
  };

  const handleCustomGenreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const displayGenre = customGenre.trim() || activeGenre;
  const marketLabel = MARKETS.find(m => m.value === market)?.label ?? "Global (All)";

  return (
    <div
      className="min-h-[100dvh] w-full"
      style={{ background: "#FBF9F6", fontFamily: "'Inter', sans-serif" }}
    >
      <div className="max-w-[1280px] mx-auto px-6 py-10 md:py-14 flex flex-col md:flex-row gap-10 md:gap-14">

        {/* ── Left Panel ── */}
        <aside className="w-full md:w-[320px] flex-shrink-0 flex flex-col gap-8">

          {/* Brand */}
          <div>
            <h1
              className="niche-logo"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "3.25rem",
                fontWeight: 700,
                fontStyle: "italic",
                lineHeight: 1,
                color: "#2C2420",
                letterSpacing: "-0.035em",
                textShadow: "0 1px 4px rgba(44, 36, 32, 0.10), 0 0px 1px rgba(44, 36, 32, 0.06)",
              }}
            >
              niche
            </h1>
            <p style={{ color: "#8A7E79", marginTop: "8px", fontSize: "0.875rem", lineHeight: 1.5 }}>
              Music made for you, not the algorithm.
            </p>
          </div>

          {/* Spotify connect / disconnect */}
          {oauthAuthed ? (
            <div className="flex flex-col gap-2">
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-full"
                style={{ background: "#EDF7ED", border: "1.5px solid #A5D6A7" }}
              >
                <SiSpotify size={16} color="#2E7D32" />
                <span style={{ color: "#2E7D32", fontSize: "0.875rem", fontWeight: 500 }}>
                  Spotify Connected
                </span>
              </div>
              <button
                onClick={handleDisconnect}
                className="text-xs underline transition-opacity hover:opacity-70 text-left"
                style={{ color: "#B0A49E" }}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-full font-semibold transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
              style={{
                backgroundColor: "#1DB954",
                color: "white",
                fontSize: "0.9375rem",
                boxShadow: "0 2px 12px rgba(29,185,84,0.28)",
              }}
            >
              <SiSpotify size={20} />
              Connect Spotify
            </button>
          )}

          {/* Live API badge */}
          {usingLiveApi && !oauthAuthed && (
            <div style={{ background: "#EDF7ED", border: "1px solid #A5D6A7", borderRadius: "8px", padding: "8px 12px" }}>
              <p style={{ color: "#2E7D32", fontSize: "0.75rem", fontWeight: 500 }}>
                ✓ Live Spotify data active
              </p>
            </div>
          )}
          {apiError && (
            <div style={{ background: "#FFF3E0", border: "1px solid #FFCC80", borderRadius: "8px", padding: "8px 12px" }}>
              <p style={{ color: "#E65100", fontSize: "0.75rem" }}>Spotify API error — showing curated data</p>
            </div>
          )}

          {/* Genre chips */}
          <div className="flex flex-col gap-3">
            <p
              className="uppercase tracking-widest"
              style={{ fontSize: "0.68rem", fontWeight: 600, color: "#B0A49E", letterSpacing: "0.13em" }}
            >
              Start with a Vibe
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {GENRES.map(genre => {
                const isActive = genre === activeGenre && !customGenre.trim();
                return (
                  <button
                    key={genre}
                    onClick={() => { setActiveGenre(genre); setCustomGenre(""); }}
                    className="py-2.5 rounded-full font-medium transition-all duration-150 text-sm"
                    style={isActive ? {
                      backgroundColor: "#C1614F",
                      color: "white",
                      boxShadow: "0 2px 8px rgba(193,97,79,0.28)",
                      border: "1.5px solid #C1614F",
                    } : {
                      backgroundColor: "transparent",
                      color: "#3D3530",
                      border: "1.5px solid #DDD7D1",
                    }}
                  >
                    {genre}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom genre */}
          <div className="flex flex-col gap-2">
            <p
              className="uppercase tracking-widest"
              style={{ fontSize: "0.68rem", fontWeight: 600, color: "#B0A49E", letterSpacing: "0.13em" }}
            >
              Or type a custom genre
            </p>
            <form onSubmit={handleCustomGenreSubmit} className="flex gap-2">
              <input
                type="text"
                value={customGenre}
                onChange={e => setCustomGenre(e.target.value)}
                placeholder="e.g. Bossa Nova, Shoegaze…"
                className="flex-1 py-2.5 px-4 rounded-full text-sm outline-none transition-all"
                style={{
                  background: "#F0EBE6",
                  border: "1.5px solid #E2DAD4",
                  color: "#2C2420",
                  fontFamily: "'Inter', sans-serif",
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = "#C1614F";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(193,97,79,0.12)";
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = "#E2DAD4";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              {customGenre.trim() && (
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-full text-sm font-medium transition-all active:scale-95"
                  style={{ backgroundColor: "#C1614F", color: "white" }}
                >
                  Go
                </button>
              )}
            </form>
          </div>

          {/* ── Market / Region selector ── */}
          <div className="flex flex-col gap-2">
            <p
              className="uppercase tracking-widest"
              style={{ fontSize: "0.68rem", fontWeight: 600, color: "#B0A49E", letterSpacing: "0.13em" }}
            >
              Select Region / Language
            </p>
            <div className="relative">
              <select
                value={market}
                onChange={e => setMarket(e.target.value)}
                className="w-full appearance-none py-2.5 pl-4 pr-10 rounded-full text-sm outline-none transition-all cursor-pointer"
                style={{
                  background: "#F0EBE6",
                  border: "1.5px solid #E2DAD4",
                  color: "#2C2420",
                  fontFamily: "'Inter', sans-serif",
                  boxShadow: "0 1px 3px rgba(44,36,32,0.05)",
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = "#C1614F";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(193,97,79,0.12)";
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = "#E2DAD4";
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(44,36,32,0.05)";
                }}
              >
                {MARKETS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              {/* Custom chevron */}
              <span
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
                style={{ color: "#B0A49E" }}
              >
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                  <path d="M1 1L6 6.5L11 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </div>
          </div>

          {/* Obscurity slider */}
          <div className="flex flex-col gap-3">
            <p
              className="uppercase tracking-widest"
              style={{ fontSize: "0.68rem", fontWeight: 600, color: "#B0A49E", letterSpacing: "0.13em" }}
            >
              How Deep?
            </p>
            <input
              type="range"
              min="0"
              max="2"
              step="1"
              value={obscurity}
              onChange={e => setObscurity(Number(e.target.value))}
              className="custom-range"
              style={{
                background: `linear-gradient(to right, #C1614F ${(obscurity / 2) * 100}%, #E2DAD4 ${(obscurity / 2) * 100}%)`
              }}
            />
            <div className="flex justify-between">
              {OBSCURITY_SLIDER_LABELS.map((label, i) => (
                <span
                  key={label}
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: obscurity === i ? 600 : 400,
                    color: obscurity === i ? "#C1614F" : "#B0A49E",
                    transition: "all 0.15s",
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
            className="w-full py-3.5 rounded-2xl font-semibold transition-all duration-150 hover:brightness-[0.97] active:scale-[0.98] text-sm"
            style={{
              background: "#FFFFFF",
              border: "1.5px solid #DDD7D1",
              color: "#3D3530",
              boxShadow: "0 1px 4px rgba(44,36,32,0.06)",
              letterSpacing: "0.02em",
            }}
          >
            ✦ Surprise Me
          </button>
        </aside>

        {/* ── Right Panel ── */}
        <main className="flex-1 flex flex-col min-w-0">
          <div className="mb-8">
            <h2
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "2.25rem",
                fontWeight: 700,
                color: "#2C2420",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
              }}
            >
              Your Fresh Finds
            </h2>
            <p style={{ color: "#8A7E79", marginTop: "8px", fontSize: "0.9375rem" }}>
              Digging into{" "}
              <span style={{ color: "#2C2420", fontWeight: 600 }}>{displayGenre}</span>
              {" "}
              <span style={{ color: "#C1614F" }}>•</span>
              {" "}
              <span>{obscurityLabel(obscurity)}</span>
              {" "}
              <span style={{ color: "#C1614F" }}>•</span>
              {" "}
              <span>{marketLabel}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-5">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            ) : (
              <AnimatePresence mode="popLayout">
                {tracks.map((song, idx) => (
                  <motion.div
                    key={`${song.title}-${song.artist}-${idx}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.26, delay: idx * 0.05, ease: [0.22, 1, 0.36, 1] }}
                    layout
                  >
                    <SongCard song={song} />
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </main>

      </div>
    </div>
  );
}
