import { useState, useEffect } from "react";
import { SiSpotify } from "react-icons/si";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

const MOCK_DATA: Record<string, { title: string; artist: string; gradient: string }[]> = {
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

function SongCard({ song }: { song: { title: string; artist: string; gradient: string } }) {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-[hsl(var(--card-border))] flex flex-col gap-4">
      <div 
        className="w-full aspect-square rounded-xl"
        style={{ background: song.gradient }}
        data-testid={`gradient-${song.title}`}
      />
      <div className="flex-1">
        <h3 className="font-bold text-gray-900 line-clamp-1" title={song.title}>{song.title}</h3>
        <p className="text-sm text-gray-500 line-clamp-1" title={song.artist}>{song.artist}</p>
      </div>
      <button 
        onClick={handleAdd}
        data-testid={`button-add-${song.title}`}
        className="w-full py-2.5 rounded-full font-medium transition-colors text-sm"
        style={{ 
          backgroundColor: added ? '#3D3530' : '#C1614F',
          color: 'white'
        }}
      >
        {added ? "Added!" : "+ Add to Playlist"}
      </button>
    </div>
  );
}

export default function Home() {
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [activeGenre, setActiveGenre] = useState("Pop");
  const [obscurity, setObscurity] = useState(0);

  const handleConnect = () => {
    setSpotifyConnected(true);
    setTimeout(() => setSpotifyConnected(false), 2000);
  };

  const handleSurprise = () => {
    const randomGenre = GENRES[Math.floor(Math.random() * GENRES.length)];
    const randomObscurity = Math.floor(Math.random() * 3);
    setActiveGenre(randomGenre);
    setObscurity(randomObscurity);
  };

  const currentSongs = MOCK_DATA[`${activeGenre}-${obscurity}`] || [];

  return (
    <div className="min-h-[100dvh] w-full bg-[hsl(var(--background))] flex justify-center p-4 md:p-8">
      <div className="max-w-6xl w-full flex flex-col md:flex-row gap-8 md:gap-16">
        
        {/* Left Panel */}
        <div className="w-full md:w-[35%] flex flex-col gap-10">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Niche</h1>
            <p className="text-gray-500 mt-2 font-medium">Music made for you, not the algorithm.</p>
          </div>

          <button
            data-testid="button-connect-spotify"
            onClick={handleConnect}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full text-white font-semibold transition-transform hover:scale-[1.02] active:scale-95"
            style={{ backgroundColor: '#1DB954' }}
          >
            <SiSpotify className="w-5 h-5" />
            {spotifyConnected ? "Connected!" : "Connect Spotify"}
          </button>

          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Start with a Vibe</h2>
            <div className="grid grid-cols-2 gap-3">
              {GENRES.map(genre => {
                const isActive = genre === activeGenre;
                return (
                  <button
                    key={genre}
                    data-testid={`button-genre-${genre}`}
                    onClick={() => setActiveGenre(genre)}
                    className={`py-3 rounded-full font-medium transition-all ${
                      isActive 
                        ? "bg-[#3D3530] text-white shadow-md" 
                        : "bg-transparent border-2 border-[#E2DDD8] text-[#3D3530] hover:border-[#3D3530]"
                    }`}
                  >
                    {genre}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">How Deep?</h2>
            
            <input 
              type="range" 
              min="0" 
              max="2" 
              step="1"
              value={obscurity}
              onChange={(e) => setObscurity(Number(e.target.value))}
              className="custom-range"
              data-testid="slider-obscurity"
              style={{
                background: `linear-gradient(to right, #3D3530 ${(obscurity / 2) * 100}%, var(--color-input) ${(obscurity / 2) * 100}%)`
              }}
            />

            <div className="flex justify-between text-xs font-medium text-gray-500">
              <span className={obscurity === 0 ? "text-[#3D3530]" : ""}>Familiar</span>
              <span className={obscurity === 1 ? "text-[#3D3530]" : ""}>A Bit Niche</span>
              <span className={obscurity === 2 ? "text-[#3D3530]" : ""}>Hidden Gems</span>
            </div>
          </div>

          <button
            data-testid="button-surprise"
            onClick={handleSurprise}
            className="w-full py-4 rounded-2xl bg-white border-2 border-[#E2DDD8] text-[#3D3530] font-bold hover:bg-gray-50 transition-colors mt-auto"
          >
            Surprise Me 🎲
          </button>
        </div>

        {/* Right Panel */}
        <div className="w-full md:w-[65%] flex flex-col pt-4 md:pt-0">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Your Fresh Finds</h2>
            <p className="text-gray-500 mt-2 text-lg">Based on your taste in <span className="font-semibold text-[#3D3530]">{activeGenre}</span></p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {currentSongs.map((song, idx) => (
                <motion.div
                  key={`${song.title}-${song.artist}-${idx}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                  layout
                >
                  <SongCard song={song} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}
