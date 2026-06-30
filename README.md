#  niche
### *Music made for you, not the algorithm.*

[![React](https://img.shields.io/badge/React-18-blue?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-Fast-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-Aesthetic-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Spotify API](https://img.shields.io/badge/Spotify-API_Integrated-1DB954?logo=spotify&logoColor=white)](https://developer.spotify.com/)

https://github.com/user-attachments/assets/eb8fbb1e-e377-498e-890e-5856e959ff95

**niche** is a minimalist, aesthetic discovery dashboard that puts music curation back into human hands. By pairing custom layout engines with the official Spotify Web API, it lets you bypass automated corporate feeds, explore handcrafted vibes, filter out the noise with an interactive Trash Bin, and export your personal collections instantly.

---


## Spotify Developer Sandbox Note

Because this app connects directly to live production endpoints on the official Spotify Web API, it currently runs in a secure developer sandbox environment. 

- **If you are reviewing this project and want to test it live with your personal streaming account**, please reach out with your Spotify login email, and I will whitelist your account access instantly!
- Otherwise, please check out the live preview animation at the top of this file to see the frontend state filtering and audio engines in action.

---

##  Features That Make it Special

* **Hand-Curated Handshakes:** Directly routes your dashboard grids to public playlists tailored by Genre, Language, and Obscurity level—curating real human taste.
* **Bulletproof Fallback Search:** If a unique category combination isn't curated yet, the system smoothly falls back to a smart, paginated global live search index so your discovery loop never breaks.
* **Persistent Trash Bin:** Tired of random tracks ruining the vibe? Hit the `×` button to drop a track into your persistent storage bin. It saves to your browser automatically so binned tracks stay hidden even after a refresh.
* **Secure Connection:** Connects instantly using standard Spotify OAuth with PKCE verification, keeping your session fully synchronized and encrypted.

---

## Curation Boundaries & Future Enhancements

While the dashboard framework, PKCE auth flow, and dynamic audio engines are fully stable, music metadata sync introduces a few natural platform limits:

1. **Strict Local Bin Lifecycle**: The Trash Bin safely retains track IDs inside `localStorage`. However, because fresh database queries pull localized sets from Spotify's live endpoints, previously binned tracks will only display in the Bin archive if they happen to appear in the active API fetch pool.
2. **Spotify Search Parameter Tagging**: When cross-filtering complex matches (e.g., `Jazz` + `Japanese`), results depend entirely on how Spotify indexes track metadata. If explicit metadata matches are too narrow, the network fallbacks prioritize core genre filters to ensure the dashboard UI never serves an empty grid.

*Planned Update: Building a localized database cache to permanently map and store historical track payloads for binned items across active sessions.*

---

## Quick Start

### Clone & Install
```bash
git clone [https://github.com/anushkaganju/music-discovery-hub.git](https://github.com/anushkaganju/music-discovery-hub.git)
cd music-discovery-hub
npm install
