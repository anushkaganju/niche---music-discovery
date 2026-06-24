// artifacts/niche/src/lib/spotifyAuth.ts

const CLIENT_ID: string =
  (import.meta.env.VITE_SPOTIFY_CLIENT_ID as string | undefined) ??
  "77f5f74668bd46a285eb2051f1938855";

const SCOPES = [
  "user-read-private",
  "user-read-email",
  "playlist-modify-public",
  "playlist-modify-private",
].join(" ");

const TOKEN_KEY = "niche_access_token";
const REFRESH_KEY = "niche_refresh_token";
const EXPIRY_KEY = "niche_token_expiry";
const VERIFIER_KEY = "niche_pkce_verifier";

// ── Helpers ────────────────────────────────────────────────────────────────
function getRedirectUri(): string {
  return `${window.location.origin}/callback`;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function generateCodeVerifier(): string {
  const arr = new Uint8Array(64);
  crypto.getRandomValues(arr);
  return base64UrlEncode(arr);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  if (!window.crypto?.subtle) {
    throw new Error(
      "crypto.subtle is unavailable. Open the app over https:// (not http://). " +
        "On Replit, click 'Open in new tab' on the top-right of the preview pane.",
    );
  }
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(digest));
}

// ── Public API ─────────────────────────────────────────────────────────────

/** True if a Spotify CLIENT_ID is bundled into the running app. */
export function hasClientId(): boolean {
  return typeof CLIENT_ID === "string" && CLIENT_ID.trim().length > 0;
}

/** Returns the stored access token (may be expired). */
export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/** True if there is a stored access token (regardless of expiry). */
export function isAuthenticated(): boolean {
  return !!localStorage.getItem(TOKEN_KEY);
}

/** Wipe all stored auth state. */
export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(EXPIRY_KEY);
  sessionStorage.removeItem(VERIFIER_KEY);
}

/** Step 1 of OAuth: redirect the browser to Spotify's consent page. */
export async function initiateSpotifyAuth(): Promise<void> {
  console.log("[spotifyAuth] initiateSpotifyAuth() called");
  console.log("[spotifyAuth] CLIENT_ID =", JSON.stringify(CLIENT_ID));
  console.log("[spotifyAuth] origin =", window.location.origin);
  console.log("[spotifyAuth] protocol =", window.location.protocol);

  if (!hasClientId()) {
    throw new Error("Spotify CLIENT_ID is empty — wrong file being bundled.");
  }

  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  sessionStorage.setItem(VERIFIER_KEY, verifier);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: getRedirectUri(),
    scope: SCOPES,
    code_challenge_method: "S256",
    code_challenge: challenge,
  });

  const url = `https://accounts.spotify.com/authorize?${params.toString()}`;
  console.log("[spotifyAuth] redirecting to:", url);
  window.location.assign(url);
}

/**
 * Step 2 of OAuth: exchange the ?code= returned by Spotify
 * for an access token + refresh token. Returns the access token,
 * or null on failure.
 */
export async function handleOAuthCallback(
  code: string,
): Promise<string | null> {
  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  if (!verifier) {
    console.error("[spotifyAuth] Missing PKCE verifier in sessionStorage.");
    return null;
  }

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: "authorization_code",
    code,
    redirect_uri: getRedirectUri(),
    code_verifier: verifier,
  });

  try {
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(
        "[spotifyAuth] Token exchange failed:",
        res.status,
        errText,
      );
      return null;
    }

    const data = (await res.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };

    const expiresAt = Date.now() + data.expires_in * 1000;
    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem(EXPIRY_KEY, String(expiresAt));
    if (data.refresh_token) {
      localStorage.setItem(REFRESH_KEY, data.refresh_token);
    }
    sessionStorage.removeItem(VERIFIER_KEY);
    return data.access_token;
  } catch (err) {
    console.error("[spotifyAuth] Token exchange threw:", err);
    return null;
  }
}

/** Refresh the access token using the stored refresh token. */
async function refreshAccessToken(): Promise<string | null> {
  const refresh = localStorage.getItem(REFRESH_KEY);
  if (!refresh) return null;

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: "refresh_token",
    refresh_token: refresh,
  });

  try {
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) {
      console.error("[spotifyAuth] Refresh failed:", res.status);
      clearAuth();
      return null;
    }
    const data = (await res.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };
    const expiresAt = Date.now() + data.expires_in * 1000;
    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem(EXPIRY_KEY, String(expiresAt));
    if (data.refresh_token) {
      localStorage.setItem(REFRESH_KEY, data.refresh_token);
    }
    return data.access_token;
  } catch (err) {
    console.error("[spotifyAuth] Refresh threw:", err);
    return null;
  }
}

/**
 * Return a valid (non-expired) access token, refreshing if needed.
 * Returns null if the user is not connected or refresh failed.
 */
export async function getValidToken(): Promise<string | null> {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiryStr = localStorage.getItem(EXPIRY_KEY);
  if (!token) return null;

  const expiry = expiryStr ? parseInt(expiryStr, 10) : 0;
  // Refresh 60s before actual expiry to avoid edge-case 401s
  if (Date.now() < expiry - 60_000) return token;

  return await refreshAccessToken();
}
