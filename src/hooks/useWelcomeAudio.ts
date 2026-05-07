import { useEffect } from "react";
import { fetchVoiceWelcomeBuffer } from "@/lib/api";

const FLAG = "welcome_played";

/**
 * Phase 7 — Plays the dashboard welcome audio once per browser session.
 * Skips entirely if sessionStorage flag exists.
 * Volume capped at 0.4. Fails silently.
 */
export function useWelcomeAudio() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem(FLAG)) return;
    } catch {
      return;
    }
    let cancelled = false;
    let audio: HTMLAudioElement | null = null;
    let url: string | null = null;

    (async () => {
      const buf = await fetchVoiceWelcomeBuffer();
      if (cancelled || !buf) return;
      try {
        const blob = new Blob([buf], { type: "audio/mpeg" });
        url = URL.createObjectURL(blob);
        audio = new Audio(url);
        audio.volume = 0.4;
        await audio.play();
        try { sessionStorage.setItem(FLAG, "1"); } catch { /* noop */ }
      } catch {
        /* autoplay blocked or any other error — stay silent */
      }
    })();

    return () => {
      cancelled = true;
      if (audio) {
        audio.pause();
        audio.src = "";
      }
      if (url) URL.revokeObjectURL(url);
    };
  }, []);
}