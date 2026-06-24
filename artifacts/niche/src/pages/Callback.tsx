import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { handleOAuthCallback } from "@/lib/spotifyAuth"; // adjust path if needed

export default function Callback() {
  const [, navigate] = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const authError = params.get("error");

    if (authError) {
      setError(`Spotify denied access: ${authError}`);
      return;
    }

    if (!code) {
      setError("No authorization code returned from Spotify.");
      return;
    }

    handleOAuthCallback(code)
      .then((token) => {
        if (token) {
          navigate("/", { replace: true });
        } else {
          setError("Could not complete Spotify login. Please try again.");
        }
      })
      .catch(() => {
        setError("Something went wrong while logging in.");
      });
  }, [navigate]);

  if (error) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <p>{error}</p>
        <button onClick={() => navigate("/")}>Back to home</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, textAlign: "center" }}>
      <p>Connecting your Spotify account...</p>
    </div>
  );
}
