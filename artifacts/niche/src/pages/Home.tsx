import { useState } from "react";
import { SiSpotify } from "react-icons/si";
import { AnimatePresence, motion } from "framer-motion";

const MOCK_DATA: Record<string, { title: string; artist: string; gradient: string; albumArt?: string }[]> = {
  "Pop-0": [
    { title: "Levitating", artist: "Dua Lipa", gradient: "linear-gradient(135deg, #f8b4d9 0%, #fbc8a3 100%)" },
    { title: "Blinding Lights", artist: "The Weeknd", gradient: "linear-gradient(135deg, #ffd6e7 0%, #ffb3c6 100%)" },
    { title: "Shape of You", artist: "Ed Sheeran", gradient: "linear-gradient(135deg, #ffd6a5 0%, #fdffb6 100%)" }
  ],
  "Pop-1": [
    { title: "Solar Power", artist: "Lorde", gradient: "linear-gradient(135deg, #caffbf 0%, #fdffb6 100%)" },
    { title: "Nightmare Dressed Like a Daydream", artist: "Maisie Peters", gradient: "linear-gradient(135deg, #e0aaff 0%, #c8b6ff 100%)" },
    { title: "Easy On Me", artist: "Adele", gradient: "linear-gradient(135deg, #ffd6e7 0%, #ffecd2 100%)" }
  ],
  "Pop-2": [
    { title: "Ceilings", artist: "Lizzy McAlpine", gradient: "linear-gradient(135deg, #d8f3dc 0%, #b7e4c7 100%)" },
    { title: "Stick Season", artist: "Noah Kahan", gradient: "linear-gradient(135deg, #ffe8a3 0%, #ffd166 100%)" },
    { title: "Motion Sickness", artist: "Phoebe Bridgers", gradient: "linear-gradient(135deg, #cde2f9 0%, #a9d0f5 100%)" }
  ],
  "Rock-0": [
    { title: "Mr. Brightside", artist: "The Killers", gradient: "linear-gradient(135deg, #ff9a3c 0%, #ff6b6b 100%)" },
    { title: "Seven Nation Army", artist: "The White Stripes", gradient: "linear-gradient(135deg, #f72585 0%, #b5179e 100%)" },
    { title: "Bohemian Rhapsody", artist: "Queen", gradient: "linear-gradient(135deg, #ffd6a5 0%, #ffb347 100%)" }
  ],
  "Rock-1": [
    { title: "Dark Side of the Gym", artist: "The National", gradient: "linear-gradient(135deg, #6a4c93 0%, #9b5de5 100%)" },
    { title: "I Will Follow You into the Dark", artist: "Death Cab for Cutie", gradient: "linear-gradient(135deg, #a8dadc 0%, #457b9d 100%)" },
    { title: "Mardy Bum", artist: "Arctic Monkeys", gradient: "linear-gradient(135deg, #f4a261 0%, #e76f51 100%)" }
  ],
  "Rock-2": [
    { title: "This Is the Last Time", artist: "The National", gradient: "linear-gradient(135deg, #264653 0%, #2a9d8f 100%)" },
    { title: "Obstacles", artist: "Syd Matters", gradient: "linear-gradient(135deg, #caf0f8 0%, #90e0ef 100%)" },
    { title: "Lua", artist: "Bright Eyes", gradient: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)" }
  ],
  "Hip-Hop-0": [
    { title: "God's Plan", artist: "Drake", gradient: "linear-gradient(135deg, #ffe57f 0%, #ffca28 100%)" },
    { title: "HUMBLE.", artist: "Kendrick Lamar", gradient: "linear-gradient(135deg, #d62828 0%, #f77f00 100%)" },
    { title: "Sicko Mode", artist: "Travis Scott", gradient: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)" }
  ],
  "Hip-Hop-1": [
    { title: "Nikes", artist: "Frank Ocean", gradient: "linear-gradient(135deg, #48cae4 0%, #0077b6 100%)" },
    { title: "PRIDE.", artist: "Kendrick Lamar", gradient: "linear-gradient(135deg, #f8b4d9 0%, #c77dff 100%)" },
    { title: "Waves", artist: "Mac Miller", gradient: "linear-gradient(135deg, #74c69d 0%, #40916c 100%)" }
  ],
  "Hip-Hop-2": [
    { title: "Braindrops", artist: "Pink Siifu", gradient: "linear-gradient(135deg, #4a4e69 0%, #9a8c98 100%)" },
    { title: "Swerve City", artist: "Doomtree", gradient: "linear-gradient(135deg, #e2b96f 0%, #c8843e 100%)" },
    { title: "Westside Bound 3", artist: "Your Old Droog", gradient: "linear-gradient(135deg, #90a955 0%, #4f772d 100%)" }
  ],
  "Indie-0": [
    { title: "Electric Feel", artist: "MGMT", gradient: "linear-gradient(135deg, #7400b8 0%, #6930c3 100%)" },
    { title: "Take Me Out", artist: "Franz Ferdinand", gradient: "linear-gradient(135deg, #f72585 0%, #560bad 100%)" },
    { title: "Dog Days Are Over", artist: "Florence + The Machine", gradient: "linear-gradient(135deg, #f4d35e 0%, #ee964b 100%)" }
  ],
  "Indie-1": [
    { title: "Georgia", artist: "Benson Boone", gradient: "linear-gradient(135deg, #e2d9f3 0%, #b5a8d8 100%)" },
    { title: "In My Arms", artist: "Maisie Peters", gradient: "linear-gradient(135deg, #ffccd5 0%, #ff85a1 100%)" },
    { title: "Punisher", artist: "Phoebe Bridgers", gradient: "linear-gradient(135deg, #d4e09b 0%, #a7c957 100%)" }
  ],
  "Indie-2": [
    { title: "Stranger", artist: "Jordana", gradient: "linear-gradient(135deg, #f7cad0 0%, #ffe8d6 100%)" },
    { title: "Ivy", artist: "Frank Ocean", gradient: "linear-gradient(135deg, #a8e6cf 0%, #dcedc1 100%)" },
    { title: "Savior Complex", artist: "Phoebe Bridgers", gradient: "linear-gradient(135deg, #c3b1e1 0%, #e8d5f5 100%)" }
  ],
  "R&B-0": [
    { title: "Essence", artist: "Wizkid ft. Tems", gradient: "linear-gradient(135deg, #f4845f 0%, #f2614a 100%)" },
    { title: "Leave the Door Open", artist: "Bruno Mars & Anderson Paak", gradient: "linear-gradient(135deg, #ffb347 0%, #ff8c00 100%)" },
    { title: "Good Days", artist: "SZA", gradient: "linear-gradient(135deg, #c9ada7 0%, #9a8c98 100%)" }
  ],
  "R&B-1": [
    { title: "Hurt Me", artist: "Snoh Aalegra", gradient: "linear-gradient(135deg, #f2cdcd 0%, #e0a0b0 100%)" },
    { title: "How Will I Know", artist: "Sam Smith", gradient: "linear-gradient(135deg, #ffe8d6 0%, #f8c8a0 100%)" },
    { title: "On and On", artist: "Erykah Badu", gradient: "linear-gradient(135deg, #fbb1bd 0%, #ee82ee 100%)" }
  ],
  "R&B-2": [
    { title: "Do You Feel Me", artist: "Kadhja Bonet", gradient: "linear-gradient(135deg, #b5838d 0%, #e5989b 100%)" },
    { title: "Bed", artist: "Anaiis", gradient: "linear-gradient(135deg, #6d6875 0%, #b5838d 100%)" },
    { title: "Cranes in the Sky", artist: "Solange", gradient: "linear-gradient(135deg, #ffb4a2 0%, #e5989b 100%)" }
  ],
  "Jazz-0": [
    { title: "So What", artist: "Miles Davis", gradient: "linear-gradient(135deg, #023e8a 0%, #0077b6 100%)" },
    { title: "Take Five", artist: "Dave Brubeck", gradient: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)" },
    { title: "Round Midnight", artist: "Thelonious Monk", gradient: "linear-gradient(135deg, #10002b 0%, #240046 100%)" }
  ],
  "Jazz-1": [
    { title: "Autumn Leaves", artist: "Bill Evans Trio", gradient: "linear-gradient(135deg, #bc6c25 0%, #dda15e 100%)" },
    { title: "Sea of Tranquility", artist: "Cecile McLorin Salvant", gradient: "linear-gradient(135deg, #7a9e7e 0%, #b9d4aa 100%)" },
    { title: "Everything Is Moving So Fast", artist: "GoGo Penguin", gradient: "linear-gradient(135deg, #3c1642 0%, #086375 100%)" }
  ],
  "Jazz-2": [
    { title: "Nardis", artist: "Ahmad Jamal", gradient: "linear-gradient(135deg, #4b3832 0%, #be9b7b 100%)" },
    { title: "Umi Says", artist: "Mos Def", gradient: "linear-gradient(135deg, #2a4858 0%, #4b8b9e 100%)" },
    { title: "Spiral", artist: "Shabaka and The Ancestors", gradient: "linear-gradient(135deg, #1a1a1a 0%, #4a4a6a 100%)" }
  ]
};

const GENRES = ["Pop", "Rock", "Hip-Hop", "Indie", "R&B", "Jazz"];
const OBSCURITY_LABELS = ["Familiar Territory", "Niche Territory", "Hidden Gems"];
const OBSCURITY_SLIDER_LABELS = ["Familiar", "A Bit Niche", "Hidden Gems"];

const TRANSPARENT_PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

function SongCard({ song }: { song: { title: string; artist: string; gradient: string; albumArt?: string } }) {
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
      <div className="relative gradient-art" style={{ aspectRatio: "1 / 1", background: song.gradient }}>
        <img
          src={song.albumArt ?? TRANSPARENT_PIXEL}
          alt={`${song.title} album art`}
          data-testid={`img-album-${song.title}`}
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
          data-testid={`button-add-${song.title}`}
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

export default function Home() {
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [activeGenre, setActiveGenre] = useState("Pop");
  const [obscurity, setObscurity] = useState(0);
  const [customGenre, setCustomGenre] = useState("");

  const handleConnect = () => {
    setSpotifyConnected(true);
    setTimeout(() => setSpotifyConnected(false), 2500);
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
    if (customGenre.trim()) {
      setActiveGenre(customGenre.trim());
    }
  };

  const displayGenre = customGenre.trim() || activeGenre;
  const currentKey = `${activeGenre}-${obscurity}`;
  const currentSongs = MOCK_DATA[currentKey] || MOCK_DATA["Pop-0"];

  return (
    <div
      className="min-h-[100dvh] w-full"
      style={{ background: "#FBF9F6", fontFamily: "'Inter', sans-serif" }}
    >
      <div className="max-w-[1200px] mx-auto px-6 py-10 md:py-14 flex flex-col md:flex-row gap-10 md:gap-16">

        {/* ── Left Panel ── */}
        <aside className="w-full md:w-[340px] flex-shrink-0 flex flex-col gap-8">

          {/* Brand */}
          <div>
            <h1
              className="font-serif"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "2.75rem",
                fontWeight: 700,
                lineHeight: 1,
                color: "#2C2420",
                letterSpacing: "-0.02em",
              }}
            >
              niche
            </h1>
            <p style={{ color: "#8A7E79", marginTop: "6px", fontSize: "0.9rem" }}>
              Music made for you, not the algorithm.
            </p>
          </div>

          {/* Spotify */}
          <button
            data-testid="button-connect-spotify"
            onClick={handleConnect}
            className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-full font-semibold transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
            style={{
              backgroundColor: "#1DB954",
              color: "white",
              fontSize: "0.9375rem",
              boxShadow: "0 2px 12px rgba(29,185,84,0.30)",
            }}
          >
            <SiSpotify size={20} />
            {spotifyConnected ? "✓ Connected!" : "Connect Spotify"}
          </button>

          {/* Genre chips */}
          <div className="flex flex-col gap-3">
            <p
              className="uppercase tracking-widest"
              style={{ fontSize: "0.7rem", fontWeight: 600, color: "#B0A49E", letterSpacing: "0.12em" }}
            >
              Start with a Vibe
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {GENRES.map(genre => {
                const isActive = genre === activeGenre && !customGenre.trim();
                return (
                  <button
                    key={genre}
                    data-testid={`button-genre-${genre}`}
                    onClick={() => { setActiveGenre(genre); setCustomGenre(""); }}
                    className="py-2.5 rounded-full font-medium transition-all duration-150 text-sm"
                    style={isActive ? {
                      backgroundColor: "#C1614F",
                      color: "white",
                      boxShadow: "0 2px 8px rgba(193,97,79,0.30)",
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

          {/* Custom genre input */}
          <div className="flex flex-col gap-2">
            <p
              className="uppercase tracking-widest"
              style={{ fontSize: "0.7rem", fontWeight: 600, color: "#B0A49E", letterSpacing: "0.12em" }}
            >
              Or type a custom genre
            </p>
            <form onSubmit={handleCustomGenreSubmit} className="flex gap-2">
              <input
                type="text"
                data-testid="input-custom-genre"
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
                onFocus={e => { e.currentTarget.style.borderColor = "#C1614F"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(193,97,79,0.12)"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "#E2DAD4"; e.currentTarget.style.boxShadow = "none"; }}
              />
              {customGenre.trim() && (
                <button
                  type="submit"
                  data-testid="button-custom-genre-submit"
                  className="px-4 py-2.5 rounded-full text-sm font-medium transition-all"
                  style={{ backgroundColor: "#C1614F", color: "white" }}
                >
                  Go
                </button>
              )}
            </form>
          </div>

          {/* Obscurity slider */}
          <div className="flex flex-col gap-3">
            <p
              className="uppercase tracking-widest"
              style={{ fontSize: "0.7rem", fontWeight: 600, color: "#B0A49E", letterSpacing: "0.12em" }}
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
              data-testid="slider-obscurity"
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
            data-testid="button-surprise"
            onClick={handleSurprise}
            className="w-full py-3.5 rounded-2xl font-semibold transition-all duration-150 hover:brightness-[0.97] active:scale-[0.98] text-sm tracking-wide"
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
        <main className="flex-1 flex flex-col">
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
              <span style={{ color: "#8A7E79" }}>{OBSCURITY_LABELS[obscurity]}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence mode="popLayout">
              {currentSongs.map((song, idx) => (
                <motion.div
                  key={`${song.title}-${song.artist}-${idx}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.28, delay: idx * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  layout
                >
                  <SongCard song={song} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </main>

      </div>
    </div>
  );
}
