import { useEffect, useRef, useState } from "react";
import { Volume2, Loader2, Pause } from "lucide-react";
import { fetchVoiceSpeakBuffer } from "@/lib/api";

interface Props {
  text: string;
  className?: string;
}

/**
 * Phase 7 — Per-message TTS speaker button.
 * Click → POST /api/voice/speak → play.
 * On any error → silently hide the icon for that message.
 */
export default function ChatSpeakerButton({ text, className = "" }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "playing" | "hidden">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);

  if (state === "hidden" || !text?.trim()) return null;

  const handleClick = async () => {
    if (state === "playing" && audioRef.current) {
      audioRef.current.pause();
      setState("idle");
      return;
    }
    setState("loading");
    const buf = await fetchVoiceSpeakBuffer(text);
    if (!buf) {
      setState("hidden");
      return;
    }
    try {
      const blob = new Blob([buf], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setState("idle");
      audio.onerror = () => setState("hidden");
      await audio.play();
      setState("playing");
    } catch {
      setState("hidden");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={state === "playing" ? "Pause voice" : "Play voice"}
      className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors ${className}`}
    >
      {state === "loading" ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : state === "playing" ? (
        <Pause className="w-3.5 h-3.5" />
      ) : (
        <Volume2 className="w-3.5 h-3.5" />
      )}
    </button>
  );
}