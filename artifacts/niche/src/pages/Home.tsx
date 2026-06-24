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

// Note: Static VITE_SPOTIFY_ACCESS_TOKEN is intentionally NOT used as a
// fallback — those tokens expire in 1 hour and would cause perpetual 401 errors.
// Live data requires OAuth ("Connect Spotify"). Without a token, the app
// silently shows curated picks with no error banner.

const GENRES = ["Pop", "Rock", "Hip-Hop", "Indie", "R&B", "Jazz"];
const LANGUAGES = ["All", "English", "Hindi", "Spanish", "Japanese"];
const OBSCURITY_LABELS = ["Familiar", "A Bit Niche", "Hidden Gems"];
const TRANSPARENT_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const PAGE_SIZE = 10;

const MOCK_DATA: Record<string, Track[]> = {
  "Pop-0": [
    {
      title: "Levitating",
      artist: "Dua Lipa",
      gradient: "linear-gradient(135deg,#f8b4d9 0%,#fbc8a3 100%)",
    },
    {
      title: "Blinding Lights",
      artist: "The Weeknd",
      gradient: "linear-gradient(135deg,#ffd6e7 0%,#ffb3c6 100%)",
    },
    {
      title: "Shape of You",
      artist: "Ed Sheeran",
      gradient: "linear-gradient(135deg,#ffd6a5 0%,#fdffb6 100%)",
    },
    {
      title: "As It Was",
      artist: "Harry Styles",
      gradient: "linear-gradient(135deg,#fce4ec 0%,#f8bbd0 100%)",
    },
    {
      title: "Anti-Hero",
      artist: "Taylor Swift",
      gradient: "linear-gradient(135deg,#e8f5e9 0%,#c8e6c9 100%)",
    },
    {
      title: "Stay",
      artist: "The Kid LAROI",
      gradient: "linear-gradient(135deg,#fff9c4 0%,#fff176 100%)",
    },
    {
      title: "Bad Habits",
      artist: "Ed Sheeran",
      gradient: "linear-gradient(135deg,#fce4ec 0%,#f48fb1 100%)",
    },
    {
      title: "Heat Waves",
      artist: "Glass Animals",
      gradient: "linear-gradient(135deg,#e3f2fd 0%,#90caf9 100%)",
    },
    {
      title: "Watermelon Sugar",
      artist: "Harry Styles",
      gradient: "linear-gradient(135deg,#f9fbe7 0%,#f0f4c3 100%)",
    },
    {
      title: "drivers license",
      artist: "Olivia Rodrigo",
      gradient: "linear-gradient(135deg,#ede7f6 0%,#b39ddb 100%)",
    },
  ],
  "Pop-1": [
    {
      title: "Solar Power",
      artist: "Lorde",
      gradient: "linear-gradient(135deg,#caffbf 0%,#fdffb6 100%)",
    },
    {
      title: "Easy On Me",
      artist: "Adele",
      gradient: "linear-gradient(135deg,#ffd6e7 0%,#ffecd2 100%)",
    },
    {
      title: "Midnight Rain",
      artist: "Taylor Swift",
      gradient: "linear-gradient(135deg,#d1c4e9 0%,#b39ddb 100%)",
    },
    {
      title: "Georgia",
      artist: "Benson Boone",
      gradient: "linear-gradient(135deg,#e2d9f3 0%,#b5a8d8 100%)",
    },
    {
      title: "Ribs",
      artist: "Lorde",
      gradient: "linear-gradient(135deg,#e8eaf6 0%,#c5cae9 100%)",
    },
    {
      title: "Heather",
      artist: "Conan Gray",
      gradient: "linear-gradient(135deg,#e8f5e9 0%,#c8e6c9 100%)",
    },
    {
      title: "Superstar",
      artist: "Carpenters",
      gradient: "linear-gradient(135deg,#fff8e1 0%,#ffecb3 100%)",
    },
    {
      title: "traitor",
      artist: "Olivia Rodrigo",
      gradient: "linear-gradient(135deg,#fce4ec 0%,#f8bbd0 100%)",
    },
    {
      title: "2step",
      artist: "Ed Sheeran",
      gradient: "linear-gradient(135deg,#e3f2fd 0%,#bbdefb 100%)",
    },
    {
      title: "In My Arms",
      artist: "Maisie Peters",
      gradient: "linear-gradient(135deg,#ffccd5 0%,#ff85a1 100%)",
    },
  ],
  "Pop-2": [
    {
      title: "Ceilings",
      artist: "Lizzy McAlpine",
      gradient: "linear-gradient(135deg,#d8f3dc 0%,#b7e4c7 100%)",
    },
    {
      title: "Stick Season",
      artist: "Noah Kahan",
      gradient: "linear-gradient(135deg,#ffe8a3 0%,#ffd166 100%)",
    },
    {
      title: "Motion Sickness",
      artist: "Phoebe Bridgers",
      gradient: "linear-gradient(135deg,#cde2f9 0%,#a9d0f5 100%)",
    },
    {
      title: "Funeral",
      artist: "Phoebe Bridgers",
      gradient: "linear-gradient(135deg,#e1bee7 0%,#ce93d8 100%)",
    },
    {
      title: "Hex Head",
      artist: "Arlo Parks",
      gradient: "linear-gradient(135deg,#fce4ec 0%,#f48fb1 100%)",
    },
    {
      title: "Stranger",
      artist: "Jordana",
      gradient: "linear-gradient(135deg,#f7cad0 0%,#ffe8d6 100%)",
    },
    {
      title: "Savior Complex",
      artist: "Phoebe Bridgers",
      gradient: "linear-gradient(135deg,#c3b1e1 0%,#e8d5f5 100%)",
    },
    {
      title: "Honey",
      artist: "Hovvdy",
      gradient: "linear-gradient(135deg,#fff9c4 0%,#fff59d 100%)",
    },
    {
      title: "Clarity",
      artist: "Raveena",
      gradient: "linear-gradient(135deg,#fce4ec 0%,#f8bbd0 100%)",
    },
    {
      title: "First Aid",
      artist: "Waxahatchee",
      gradient: "linear-gradient(135deg,#e8f5e9 0%,#a5d6a7 100%)",
    },
  ],
  "Rock-0": [
    {
      title: "Mr. Brightside",
      artist: "The Killers",
      gradient: "linear-gradient(135deg,#ff9a3c 0%,#ff6b6b 100%)",
    },
    {
      title: "Seven Nation Army",
      artist: "The White Stripes",
      gradient: "linear-gradient(135deg,#f72585 0%,#b5179e 100%)",
    },
    {
      title: "Bohemian Rhapsody",
      artist: "Queen",
      gradient: "linear-gradient(135deg,#ffd6a5 0%,#ffb347 100%)",
    },
    {
      title: "Smells Like Teen Spirit",
      artist: "Nirvana",
      gradient: "linear-gradient(135deg,#b0bec5 0%,#607d8b 100%)",
    },
    {
      title: "Wonderwall",
      artist: "Oasis",
      gradient: "linear-gradient(135deg,#fff59d 0%,#f9a825 100%)",
    },
    {
      title: "Come As You Are",
      artist: "Nirvana",
      gradient: "linear-gradient(135deg,#b2dfdb 0%,#80cbc4 100%)",
    },
    {
      title: "Under the Bridge",
      artist: "Red Hot Chili Peppers",
      gradient: "linear-gradient(135deg,#ff8a80 0%,#ff5252 100%)",
    },
    {
      title: "Creep",
      artist: "Radiohead",
      gradient: "linear-gradient(135deg,#cfd8dc 0%,#90a4ae 100%)",
    },
    {
      title: "Black",
      artist: "Pearl Jam",
      gradient: "linear-gradient(135deg,#37474f 0%,#263238 100%)",
    },
    {
      title: "Eye of the Tiger",
      artist: "Survivor",
      gradient: "linear-gradient(135deg,#ffc107 0%,#ff5722 100%)",
    },
  ],
  "Rock-1": [
    {
      title: "Dark Side of the Gym",
      artist: "The National",
      gradient: "linear-gradient(135deg,#6a4c93 0%,#9b5de5 100%)",
    },
    {
      title: "I Will Follow You into the Dark",
      artist: "Death Cab for Cutie",
      gradient: "linear-gradient(135deg,#a8dadc 0%,#457b9d 100%)",
    },
    {
      title: "The Less I Know the Better",
      artist: "Tame Impala",
      gradient: "linear-gradient(135deg,#c77dff 0%,#7b2ff7 100%)",
    },
    {
      title: "Pink Moon",
      artist: "Nick Drake",
      gradient: "linear-gradient(135deg,#ffe0b2 0%,#ffcc80 100%)",
    },
    {
      title: "505",
      artist: "Arctic Monkeys",
      gradient: "linear-gradient(135deg,#546e7a 0%,#37474f 100%)",
    },
    {
      title: "Mardy Bum",
      artist: "Arctic Monkeys",
      gradient: "linear-gradient(135deg,#f4a261 0%,#e76f51 100%)",
    },
    {
      title: "Vapour Trail",
      artist: "Ride",
      gradient: "linear-gradient(135deg,#e1f5fe 0%,#b3e5fc 100%)",
    },
    {
      title: "Fluorescent Adolescent",
      artist: "Arctic Monkeys",
      gradient: "linear-gradient(135deg,#f06292 0%,#e91e63 100%)",
    },
    {
      title: "When The Sun Goes Down",
      artist: "Arctic Monkeys",
      gradient: "linear-gradient(135deg,#ff8f00 0%,#ff6f00 100%)",
    },
    {
      title: "Knee Socks",
      artist: "Arctic Monkeys",
      gradient: "linear-gradient(135deg,#78909c 0%,#546e7a 100%)",
    },
  ],
  "Rock-2": [
    {
      title: "This Is the Last Time",
      artist: "The National",
      gradient: "linear-gradient(135deg,#264653 0%,#2a9d8f 100%)",
    },
    {
      title: "Lua",
      artist: "Bright Eyes",
      gradient: "linear-gradient(135deg,#ffecd2 0%,#fcb69f 100%)",
    },
    {
      title: "Fourth of July",
      artist: "Sufjan Stevens",
      gradient: "linear-gradient(135deg,#e8eaf6 0%,#9fa8da 100%)",
    },
    {
      title: "No Children",
      artist: "The Mountain Goats",
      gradient: "linear-gradient(135deg,#efebe9 0%,#d7ccc8 100%)",
    },
    {
      title: "White Winter Hymnal",
      artist: "Fleet Foxes",
      gradient: "linear-gradient(135deg,#e8eaf6 0%,#c5cae9 100%)",
    },
    {
      title: "Casimir Pulaski Day",
      artist: "Sufjan Stevens",
      gradient: "linear-gradient(135deg,#e3f2fd 0%,#90caf9 100%)",
    },
    {
      title: "Have One on Me",
      artist: "Joanna Newsom",
      gradient: "linear-gradient(135deg,#fff8e1 0%,#ffe082 100%)",
    },
    {
      title: "Obstacles",
      artist: "Syd Matters",
      gradient: "linear-gradient(135deg,#caf0f8 0%,#90e0ef 100%)",
    },
    {
      title: "Tiger Mountain Peasant Song",
      artist: "Fleet Foxes",
      gradient: "linear-gradient(135deg,#f1f8e9 0%,#dcedc8 100%)",
    },
    {
      title: "Heretic Pride",
      artist: "The Mountain Goats",
      gradient: "linear-gradient(135deg,#fff3e0 0%,#ffe0b2 100%)",
    },
  ],
  "Hip-Hop-0": [
    {
      title: "God's Plan",
      artist: "Drake",
      gradient: "linear-gradient(135deg,#ffe57f 0%,#ffca28 100%)",
    },
    {
      title: "HUMBLE.",
      artist: "Kendrick Lamar",
      gradient: "linear-gradient(135deg,#d62828 0%,#f77f00 100%)",
    },
    {
      title: "Sicko Mode",
      artist: "Travis Scott",
      gradient: "linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)",
    },
    {
      title: "Not Like Us",
      artist: "Kendrick Lamar",
      gradient: "linear-gradient(135deg,#1b5e20 0%,#2e7d32 100%)",
    },
    {
      title: "DNA.",
      artist: "Kendrick Lamar",
      gradient: "linear-gradient(135deg,#b71c1c 0%,#d32f2f 100%)",
    },
    {
      title: "Rockstar",
      artist: "Post Malone ft. 21 Savage",
      gradient: "linear-gradient(135deg,#4a148c 0%,#6a1b9a 100%)",
    },
    {
      title: "Industry Baby",
      artist: "Lil Nas X",
      gradient: "linear-gradient(135deg,#1565c0 0%,#1976d2 100%)",
    },
    {
      title: "Rich Flex",
      artist: "Drake & 21 Savage",
      gradient: "linear-gradient(135deg,#212121 0%,#424242 100%)",
    },
    {
      title: "Essence",
      artist: "Wizkid ft. Tems",
      gradient: "linear-gradient(135deg,#f57f17 0%,#ffa000 100%)",
    },
    {
      title: "MONTERO",
      artist: "Lil Nas X",
      gradient: "linear-gradient(135deg,#880e4f 0%,#ad1457 100%)",
    },
  ],
  "Hip-Hop-1": [
    {
      title: "Nikes",
      artist: "Frank Ocean",
      gradient: "linear-gradient(135deg,#48cae4 0%,#0077b6 100%)",
    },
    {
      title: "PRIDE.",
      artist: "Kendrick Lamar",
      gradient: "linear-gradient(135deg,#f8b4d9 0%,#c77dff 100%)",
    },
    {
      title: "Waves",
      artist: "Mac Miller",
      gradient: "linear-gradient(135deg,#74c69d 0%,#40916c 100%)",
    },
    {
      title: "Self Control",
      artist: "Frank Ocean",
      gradient: "linear-gradient(135deg,#b2ebf2 0%,#80deea 100%)",
    },
    {
      title: "2009",
      artist: "Mac Miller",
      gradient: "linear-gradient(135deg,#e8f5e9 0%,#81c784 100%)",
    },
    {
      title: "Programs",
      artist: "Saba",
      gradient: "linear-gradient(135deg,#ede7f6 0%,#b39ddb 100%)",
    },
    {
      title: "Shadow of a Doubt",
      artist: "Noname",
      gradient: "linear-gradient(135deg,#f3e5f5 0%,#e1bee7 100%)",
    },
    {
      title: "THat'XXX",
      artist: "Isaiah Rashad",
      gradient: "linear-gradient(135deg,#fce4ec 0%,#f8bbd0 100%)",
    },
    {
      title: "Telefone",
      artist: "Noname",
      gradient: "linear-gradient(135deg,#e8eaf6 0%,#c5cae9 100%)",
    },
    {
      title: "Free Lunch",
      artist: "Isaiah Rashad",
      gradient: "linear-gradient(135deg,#e1f5fe 0%,#b3e5fc 100%)",
    },
  ],
  "Hip-Hop-2": [
    {
      title: "Braindrops",
      artist: "Pink Siifu",
      gradient: "linear-gradient(135deg,#4a4e69 0%,#9a8c98 100%)",
    },
    {
      title: "Wool",
      artist: "billy woods",
      gradient: "linear-gradient(135deg,#5d4037 0%,#4e342e 100%)",
    },
    {
      title: "Drift",
      artist: "Injury Reserve",
      gradient: "linear-gradient(135deg,#37474f 0%,#263238 100%)",
    },
    {
      title: "Simple Simon",
      artist: "Milo",
      gradient: "linear-gradient(135deg,#efebe9 0%,#d7ccc8 100%)",
    },
    {
      title: "Westside Bound 3",
      artist: "Your Old Droog",
      gradient: "linear-gradient(135deg,#90a955 0%,#4f772d 100%)",
    },
    {
      title: "Talk to Me",
      artist: "Armand Hammer",
      gradient: "linear-gradient(135deg,#3e2723 0%,#4e342e 100%)",
    },
    {
      title: "Furtive Movements",
      artist: "billy woods",
      gradient: "linear-gradient(135deg,#263238 0%,#37474f 100%)",
    },
    {
      title: "Outside",
      artist: "Milo",
      gradient: "linear-gradient(135deg,#f3e5f5 0%,#e1bee7 100%)",
    },
    {
      title: "Swerve City",
      artist: "Doomtree",
      gradient: "linear-gradient(135deg,#e2b96f 0%,#c8843e 100%)",
    },
    {
      title: "An Idea",
      artist: "Pink Siifu",
      gradient: "linear-gradient(135deg,#e8f5e9 0%,#c8e6c9 100%)",
    },
  ],
  "Indie-0": [
    {
      title: "Electric Feel",
      artist: "MGMT",
      gradient: "linear-gradient(135deg,#7400b8 0%,#6930c3 100%)",
    },
    {
      title: "Dog Days Are Over",
      artist: "Florence + The Machine",
      gradient: "linear-gradient(135deg,#f4d35e 0%,#ee964b 100%)",
    },
    {
      title: "Ho Hey",
      artist: "The Lumineers",
      gradient: "linear-gradient(135deg,#fff176 0%,#ffd54f 100%)",
    },
    {
      title: "Little Talks",
      artist: "Of Monsters and Men",
      gradient: "linear-gradient(135deg,#b3e5fc 0%,#81d4fa 100%)",
    },
    {
      title: "Tongue Tied",
      artist: "Grouplove",
      gradient: "linear-gradient(135deg,#f48fb1 0%,#f06292 100%)",
    },
    {
      title: "Kids",
      artist: "MGMT",
      gradient: "linear-gradient(135deg,#ce93d8 0%,#ab47bc 100%)",
    },
    {
      title: "Take Me Out",
      artist: "Franz Ferdinand",
      gradient: "linear-gradient(135deg,#f72585 0%,#560bad 100%)",
    },
    {
      title: "Pumped Up Kicks",
      artist: "Foster the People",
      gradient: "linear-gradient(135deg,#80cbc4 0%,#4db6ac 100%)",
    },
    {
      title: "Such Great Heights",
      artist: "The Postal Service",
      gradient: "linear-gradient(135deg,#81d4fa 0%,#4fc3f7 100%)",
    },
    {
      title: "Home",
      artist: "Edward Sharpe & The Magnetic Zeros",
      gradient: "linear-gradient(135deg,#ffe082 0%,#ffd54f 100%)",
    },
  ],
  "Indie-1": [
    {
      title: "First Day of My Life",
      artist: "Bright Eyes",
      gradient: "linear-gradient(135deg,#ffe0b2 0%,#ffcc80 100%)",
    },
    {
      title: "Punisher",
      artist: "Phoebe Bridgers",
      gradient: "linear-gradient(135deg,#d4e09b 0%,#a7c957 100%)",
    },
    {
      title: "Lua",
      artist: "Bright Eyes",
      gradient: "linear-gradient(135deg,#ffecd2 0%,#fcb69f 100%)",
    },
    {
      title: "Moon River",
      artist: "Frank Ocean",
      gradient: "linear-gradient(135deg,#e3f2fd 0%,#bbdefb 100%)",
    },
    {
      title: "Ivy",
      artist: "Frank Ocean",
      gradient: "linear-gradient(135deg,#a8e6cf 0%,#dcedc1 100%)",
    },
    {
      title: "Georgia",
      artist: "Benson Boone",
      gradient: "linear-gradient(135deg,#e2d9f3 0%,#b5a8d8 100%)",
    },
    {
      title: "In My Arms",
      artist: "Maisie Peters",
      gradient: "linear-gradient(135deg,#ffccd5 0%,#ff85a1 100%)",
    },
    {
      title: "Ribs",
      artist: "Lorde",
      gradient: "linear-gradient(135deg,#e8eaf6 0%,#c5cae9 100%)",
    },
    {
      title: "You Are the Best Thing",
      artist: "Ray LaMontagne",
      gradient: "linear-gradient(135deg,#f9fbe7 0%,#f0f4c3 100%)",
    },
    {
      title: "Four Women",
      artist: "Nina Simone",
      gradient: "linear-gradient(135deg,#e8eaf6 0%,#c5cae9 100%)",
    },
  ],
  "Indie-2": [
    {
      title: "Stranger",
      artist: "Jordana",
      gradient: "linear-gradient(135deg,#f7cad0 0%,#ffe8d6 100%)",
    },
    {
      title: "Savior Complex",
      artist: "Phoebe Bridgers",
      gradient: "linear-gradient(135deg,#c3b1e1 0%,#e8d5f5 100%)",
    },
    {
      title: "Honey",
      artist: "Hovvdy",
      gradient: "linear-gradient(135deg,#fff9c4 0%,#fff59d 100%)",
    },
    {
      title: "Clarity",
      artist: "Raveena",
      gradient: "linear-gradient(135deg,#fce4ec 0%,#f8bbd0 100%)",
    },
    {
      title: "We Fell in Love in October",
      artist: "girl in red",
      gradient: "linear-gradient(135deg,#f3e5f5 0%,#e1bee7 100%)",
    },
    {
      title: "Some",
      artist: "girl in red",
      gradient: "linear-gradient(135deg,#e91e63 0%,#c2185b 100%)",
    },
    {
      title: "Dark Red",
      artist: "Steve Lacy",
      gradient: "linear-gradient(135deg,#b71c1c 0%,#c62828 100%)",
    },
    {
      title: "Nobody's Watching",
      artist: "Waxahatchee",
      gradient: "linear-gradient(135deg,#fff3e0 0%,#ffe0b2 100%)",
    },
    {
      title: "Devotion",
      artist: "Hurray for the Riff Raff",
      gradient: "linear-gradient(135deg,#e8f5e9 0%,#c8e6c9 100%)",
    },
    {
      title: "Bound 2",
      artist: "Kanye West",
      gradient: "linear-gradient(135deg,#ff8f00 0%,#ff6f00 100%)",
    },
  ],
  "R&B-0": [
    {
      title: "Essence",
      artist: "Wizkid ft. Tems",
      gradient: "linear-gradient(135deg,#f4845f 0%,#f2614a 100%)",
    },
    {
      title: "Leave the Door Open",
      artist: "Bruno Mars & Anderson Paak",
      gradient: "linear-gradient(135deg,#ffb347 0%,#ff8c00 100%)",
    },
    {
      title: "Good Days",
      artist: "SZA",
      gradient: "linear-gradient(135deg,#c9ada7 0%,#9a8c98 100%)",
    },
    {
      title: "Kill Bill",
      artist: "SZA",
      gradient: "linear-gradient(135deg,#ff8a80 0%,#ff5252 100%)",
    },
    {
      title: "Golden Hour",
      artist: "JVKE",
      gradient: "linear-gradient(135deg,#ffd180 0%,#ffab40 100%)",
    },
    {
      title: "Snooze",
      artist: "SZA",
      gradient: "linear-gradient(135deg,#b39ddb 0%,#9575cd 100%)",
    },
    {
      title: "Peaches",
      artist: "Justin Bieber ft. Daniel Caesar",
      gradient: "linear-gradient(135deg,#ffa726 0%,#fb8c00 100%)",
    },
    {
      title: "Love Again",
      artist: "Dua Lipa",
      gradient: "linear-gradient(135deg,#f8bbd0 0%,#f48fb1 100%)",
    },
    {
      title: "Calling My Phone",
      artist: "Lil Tjay ft. 6LACK",
      gradient: "linear-gradient(135deg,#ce93d8 0%,#ba68c8 100%)",
    },
    {
      title: "I Ain't Worried",
      artist: "OneRepublic",
      gradient: "linear-gradient(135deg,#80deea 0%,#4dd0e1 100%)",
    },
  ],
  "R&B-1": [
    {
      title: "Hurt Me",
      artist: "Snoh Aalegra",
      gradient: "linear-gradient(135deg,#f2cdcd 0%,#e0a0b0 100%)",
    },
    {
      title: "On and On",
      artist: "Erykah Badu",
      gradient: "linear-gradient(135deg,#fbb1bd 0%,#ee82ee 100%)",
    },
    {
      title: "Make Me Feel",
      artist: "Janelle Monae",
      gradient: "linear-gradient(135deg,#ea80fc 0%,#e040fb 100%)",
    },
    {
      title: "Bloom",
      artist: "Troye Sivan",
      gradient: "linear-gradient(135deg,#fce4ec 0%,#f48fb1 100%)",
    },
    {
      title: "Look What You're Doing to Me",
      artist: "Snoh Aalegra ft. A$AP Rocky",
      gradient: "linear-gradient(135deg,#f3e5f5 0%,#e1bee7 100%)",
    },
    {
      title: "Colors",
      artist: "Halsey",
      gradient: "linear-gradient(135deg,#e3f2fd 0%,#90caf9 100%)",
    },
    {
      title: "You Should Be Sad",
      artist: "Halsey",
      gradient: "linear-gradient(135deg,#ffe8d6 0%,#f8c8a0 100%)",
    },
    {
      title: "Crybaby",
      artist: "Melanie Martinez",
      gradient: "linear-gradient(135deg,#f8bbd0 0%,#f06292 100%)",
    },
    {
      title: "Soap",
      artist: "Melanie Martinez",
      gradient: "linear-gradient(135deg,#b3e5fc 0%,#81d4fa 100%)",
    },
    {
      title: "Wrong",
      artist: "MAX ft. Lil Uzi Vert",
      gradient: "linear-gradient(135deg,#1a237e 0%,#283593 100%)",
    },
  ],
  "R&B-2": [
    {
      title: "Do You Feel Me",
      artist: "Kadhja Bonet",
      gradient: "linear-gradient(135deg,#b5838d 0%,#e5989b 100%)",
    },
    {
      title: "Cranes in the Sky",
      artist: "Solange",
      gradient: "linear-gradient(135deg,#ffb4a2 0%,#e5989b 100%)",
    },
    {
      title: "Free Mind",
      artist: "Tems",
      gradient: "linear-gradient(135deg,#a9dfbf 0%,#76b041 100%)",
    },
    {
      title: "Bed",
      artist: "Anaiis",
      gradient: "linear-gradient(135deg,#6d6875 0%,#b5838d 100%)",
    },
    {
      title: "Superposition",
      artist: "Young Fathers",
      gradient: "linear-gradient(135deg,#fdfd96 0%,#ffd700 100%)",
    },
    {
      title: "Butterfly Effect",
      artist: "Hiatus Kaiyote",
      gradient: "linear-gradient(135deg,#b2dfdb 0%,#80cbc4 100%)",
    },
    {
      title: "In the Meantime",
      artist: "Nai Palm",
      gradient: "linear-gradient(135deg,#a8d8ea 0%,#7ec8e3 100%)",
    },
    {
      title: "Molasses",
      artist: "Nai Palm",
      gradient: "linear-gradient(135deg,#fce4ec 0%,#f8bbd0 100%)",
    },
    {
      title: "See Me Now",
      artist: "Kadhja Bonet",
      gradient: "linear-gradient(135deg,#d7bde2 0%,#bb8fce 100%)",
    },
    {
      title: "Shaolin Monk Motherfunk",
      artist: "Hiatus Kaiyote",
      gradient: "linear-gradient(135deg,#ffe0b2 0%,#ffcc80 100%)",
    },
  ],
  "Jazz-0": [
    {
      title: "So What",
      artist: "Miles Davis",
      gradient: "linear-gradient(135deg,#023e8a 0%,#0077b6 100%)",
    },
    {
      title: "Take Five",
      artist: "Dave Brubeck",
      gradient: "linear-gradient(135deg,#1b4332 0%,#2d6a4f 100%)",
    },
    {
      title: "Round Midnight",
      artist: "Thelonious Monk",
      gradient: "linear-gradient(135deg,#10002b 0%,#240046 100%)",
    },
    {
      title: "Autumn Leaves",
      artist: "Bill Evans",
      gradient: "linear-gradient(135deg,#bc6c25 0%,#dda15e 100%)",
    },
    {
      title: "My Favorite Things",
      artist: "John Coltrane",
      gradient: "linear-gradient(135deg,#e8f5e9 0%,#a5d6a7 100%)",
    },
    {
      title: "A Love Supreme",
      artist: "John Coltrane",
      gradient: "linear-gradient(135deg,#1a237e 0%,#283593 100%)",
    },
    {
      title: "Kind of Blue",
      artist: "Miles Davis",
      gradient: "linear-gradient(135deg,#0d47a1 0%,#1565c0 100%)",
    },
    {
      title: "Fly Me to the Moon",
      artist: "Frank Sinatra",
      gradient: "linear-gradient(135deg,#e3f2fd 0%,#90caf9 100%)",
    },
    {
      title: "Summertime",
      artist: "Ella Fitzgerald",
      gradient: "linear-gradient(135deg,#ffe082 0%,#ffd54f 100%)",
    },
    {
      title: "What a Wonderful World",
      artist: "Louis Armstrong",
      gradient: "linear-gradient(135deg,#a5d6a7 0%,#81c784 100%)",
    },
  ],
  "Jazz-1": [
    {
      title: "Sea of Tranquility",
      artist: "Cecile McLorin Salvant",
      gradient: "linear-gradient(135deg,#7a9e7e 0%,#b9d4aa 100%)",
    },
    {
      title: "Everything Is Moving So Fast",
      artist: "GoGo Penguin",
      gradient: "linear-gradient(135deg,#3c1642 0%,#086375 100%)",
    },
    {
      title: "Maiden Voyage",
      artist: "Herbie Hancock",
      gradient: "linear-gradient(135deg,#48c9b0 0%,#1abc9c 100%)",
    },
    {
      title: "Speak No Evil",
      artist: "Wayne Shorter",
      gradient: "linear-gradient(135deg,#2c3e50 0%,#3498db 100%)",
    },
    {
      title: "Alice in Wonderland",
      artist: "Bill Evans",
      gradient: "linear-gradient(135deg,#ce93d8 0%,#ab47bc 100%)",
    },
    {
      title: "Joy Spring",
      artist: "Clifford Brown",
      gradient: "linear-gradient(135deg,#ffe082 0%,#ffc107 100%)",
    },
    {
      title: "Cherokee",
      artist: "Charlie Parker",
      gradient: "linear-gradient(135deg,#4caf50 0%,#388e3c 100%)",
    },
    {
      title: "Celia",
      artist: "Cécile McLorin Salvant",
      gradient: "linear-gradient(135deg,#f5cba7 0%,#e59866 100%)",
    },
    {
      title: "Infant Eyes",
      artist: "Wayne Shorter",
      gradient: "linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)",
    },
    {
      title: "Nardis",
      artist: "Bill Evans",
      gradient: "linear-gradient(135deg,#283593 0%,#1565c0 100%)",
    },
  ],
  "Jazz-2": [
    {
      title: "Nardis",
      artist: "Ahmad Jamal",
      gradient: "linear-gradient(135deg,#4b3832 0%,#be9b7b 100%)",
    },
    {
      title: "Umi Says",
      artist: "Mos Def",
      gradient: "linear-gradient(135deg,#2a4858 0%,#4b8b9e 100%)",
    },
    {
      title: "Spiral",
      artist: "Shabaka and The Ancestors",
      gradient: "linear-gradient(135deg,#1a1a1a 0%,#4a4a6a 100%)",
    },
    {
      title: "Planetarium",
      artist: "Kamaal Williams",
      gradient: "linear-gradient(135deg,#0d0d2b 0%,#1a1a4e 100%)",
    },
    {
      title: "Afro Blue",
      artist: "Erykah Badu",
      gradient: "linear-gradient(135deg,#1c3144 0%,#2e4057 100%)",
    },
    {
      title: "Wu Hen",
      artist: "Kamaal Williams",
      gradient: "linear-gradient(135deg,#880e4f 0%,#ad1457 100%)",
    },
    {
      title: "Return to Nowhere",
      artist: "Sun Ra",
      gradient: "linear-gradient(135deg,#1a237e 0%,#311b92 100%)",
    },
    {
      title: "Open Channels",
      artist: "Shabaka and The Ancestors",
      gradient: "linear-gradient(135deg,#37474f 0%,#263238 100%)",
    },
    {
      title: "Alone Again Or",
      artist: "Love",
      gradient: "linear-gradient(135deg,#f57f17 0%,#ff8f00 100%)",
    },
    {
      title: "A House Is Not a Motel",
      artist: "Love",
      gradient: "linear-gradient(135deg,#bf360c 0%,#d84315 100%)",
    },
  ],
};

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

        {/* Heard It */}
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

        {/* Audio pill */}
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
          {/* Title row with Spotify link */}
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
          {/* Backdrop */}
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

          {/* Panel */}
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
            {/* Header */}
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

            {/* Track list */}
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

            {/* Export footer */}
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
  const callbackHandled = useRef(false);

  const C: Theme = darkMode ? DARK : LIGHT;

  // ── OAuth callback ────────────────────────────────────────────────────────
  useEffect(() => {
    if (callbackHandled.current) return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) return;
    callbackHandled.current = true;
    handleOAuthCallback(code).then((token) => {
      if (token) {
        setOauthToken(token);
        setOauthAuthed(true);
      }
      window.history.replaceState({}, "", window.location.pathname);
    });
  }, []);

  // ── Fetch from Spotify with optional random offset ────────────────────────
  const fetchTracks = useCallback(
    async (genre: string, level: number, lang: string, offset = 0) => {
      // Clear grid immediately so stale tracks never show under new filters
      setTracks([]);
      setApiError(null);
      setGridStatus(null);

      // Resolve OAuth token (attempt refresh if stored but near-expiry)
      let token: string | null = null;
      if (oauthAuthed || oauthToken) {
        const refreshed = await getValidToken();
        if (refreshed) {
          token = refreshed;
          setOauthToken(refreshed);
        }
      }

      // No valid token → prompt the user to connect, leave grid empty
      if (!token) {
        console.log(
          "[niche] No active Spotify token — awaiting OAuth connection.",
        );
        setUsingLiveApi(false);
        setGridStatus("not-connected");
        return;
      }

      setLoading(true);
      try {
        const langParam = lang === "All" ? "" : lang;
        const q = `genre:"${genre}"${langParam ? ` "${langParam}"` : ""}`;
        console.log(`[niche] Spotify search → ${q} | offset=${offset}`);
        const pool = await fetchSpotifyPool(
          genre,
          level,
          token,
          langParam,
          offset,
        );

        if (pool.length === 0) {
          console.log("[niche] No previewable tracks found for this query.");
          setGridStatus("empty");
          setUsingLiveApi(false);
        } else {
          setTracks(pool.slice(0, PAGE_SIZE));
          setUsingLiveApi(true);
          setGridStatus(null);
        }
      } catch (err) {
        if (err instanceof SpotifyAuthError) {
          // Token rejected by Spotify — clear session, prompt reconnect
          console.log(
            "[niche] Spotify rejected token (401/403) — clearing auth.",
          );
          clearAuth();
          setOauthToken(null);
          setOauthAuthed(false);
          setUsingLiveApi(false);
          setGridStatus("not-connected");
        } else {
          // Unexpected API error (5xx, rate limit, network)
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
    [oauthToken, oauthAuthed],
  );

  // Re-fetch whenever filters change (offset=0 for new filter)
  useEffect(() => {
    const genreKey = customGenre.trim() || activeGenre;
    fetchTracks(genreKey, obscurity, language, 0);
  }, [activeGenre, obscurity, customGenre, language, fetchTracks]);

  // "Get Fresh Set" — brand-new API call with randomised offset
  const getFreshSet = () => {
    const genreKey = customGenre.trim() || activeGenre;
    const offset = Math.floor(Math.random() * 35);
    fetchTracks(genreKey, obscurity, language, offset);
  };

  // "Already Heard It" — remove and refetch 1 replacement from Spotify (best-effort)
  const markHeard = (heardTrack: Track) => {
    setTracks((prev) => prev.filter((t) => t !== heardTrack));
  };

  // Auth handlers
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
      {/* Playlist Drawer */}
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
            {/* Dark mode toggle */}
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

          {/* Status */}
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
                Spotify API error — showing curated picks
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
          {/* Header row */}
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

            {/* Controls: playlist button + Get Fresh Set */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Playlist toggle */}
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

              {/* Get Fresh Set */}
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

          {/* Grid: 2 cols mobile, 5 cols tablet+ */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <SkeletonCard key={i} C={C} />
              ))}
            </div>
          ) : gridStatus !== null ? (
            /* ── Empty states ────────────────────────────────────────────── */
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
                    No previewable tracks found
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
