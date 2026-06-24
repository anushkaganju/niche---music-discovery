const CLIENT_ID: string | undefined =
  import.meta.env.VITE_SPOTIFY_CLIENT_ID || undefined;

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

// ✅ FIX #1: Redirect back to the ROOT, not /callback.
// A Vite SPA on Replit has no server-side routing, so /callback 404s before
// React ever loads. The root path always loads the app, where the callback
// useEffect can safely read ?code= from the URL.
function getRedirectUri(): string {
  return window.location.origin;
}

function generateCodeVerifier(): string {
  const array = new Uint8Array(96);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export function hasClientId(): boolean {
  return Boolean(CLIENT_ID);
}

export async function initiateSpotifyAuth(): Promise<void> {
  if (!CLIENT_ID) {
    throw new Error("VITE_SPOTIFY_CLIENT_ID is not configured.");
  }
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);

  // ✅ FIX #2: Use localStorage instead of sessionStorage for the PKCE verifier.
  // Spotify's redirect causes a full page navigation. On some browsers/Replit
  // preview frames, sessionStorage is wiped between the redirect origin and
  // destination, so the verifier is gone by the time handleOAuthCallback runs.
  // localStorage survives cross-origin navigations reliably.
  localStorage.setItem(VERIFIER_KEY, verifier);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: getRedirectUri(),
    scope: SCOPES,
    code_challenge_method: "S256",
    code_challenge: challenge,
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

function saveTokens(data: TokenResponse): void {
  localStorage.setItem(TOKEN_KEY, data.access_token);
  if (data.refresh_token) {
    localStorage.setItem(REFRESH_KEY, data.refresh_token);
  }
  const expiry = Date.now() + data.expires_in * 1000;
  localStorage.setItem(EXPIRY_KEY, String(expiry));
}

export async function handleOAuthCallback(
  code: string,
): Promise<string | null> {
  // ✅ FIX #2 (continued): Read verifier from localStorage, not sessionStorage.
  const verifier = localStorage.getItem(VERIFIER_KEY);
  if (!verifier || !CLIENT_ID) return null;

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: "authorization_code",
    code,
    redirect_uri: getRedirectUri(),
    code_verifier: verifier,
  });

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) return null;

  const data = (await res.json()) as TokenResponse;
  saveTokens(data);
  // ✅ Clean up verifier from localStorage after successful exchange
  localStorage.removeItem(VERIFIER_KEY);
  return data.access_token;
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken || !CLIENT_ID) return null;

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    clearAuth();
    return null;
  }

  const data = (await res.json()) as TokenResponse;
  saveTokens(data);
  return data.access_token;
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export async function getValidToken(): Promise<string | null> {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiry = Number(localStorage.getItem(EXPIRY_KEY) ?? "0");
  const fiveMinutes = 5 * 60 * 1000;

  if (token && expiry - Date.now() > fiveMinutes) {
    return token;
  }
  return refreshAccessToken();
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(EXPIRY_KEY);
  // ✅ Also clear verifier on full logout, in case a login was interrupted
  localStorage.removeItem(VERIFIER_KEY);
}

export function isAuthenticated(): boolean {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiry = Number(localStorage.getItem(EXPIRY_KEY) ?? "0");
  return Boolean(token) && expiry > Date.now();
}
