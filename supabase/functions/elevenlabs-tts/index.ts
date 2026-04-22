import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Voice per language — Multilingual v2 + Turbo v2.5 both support 29+ languages
// on any voice, but we map each locale to the voice that performs best for it.
// Arabic, Turkish, Korean use voices with strong tonal range for those phonemes.
const VOICE_BY_LANG: Record<string, string> = {
  en: "EXAVITQu4vr4xnSDxMaL",    // Sarah — clear English
  hi: "FGY2WhTYpPnrIDTdsKH5",    // Laura — Hindi prosody
  ur: "FGY2WhTYpPnrIDTdsKH5",    // Laura — Urdu (close to Hindi)
  ar: "Xb7hH8MSUJpSbSDYk0k2",    // Alice — strong Arabic phonemes
  es: "EXAVITQu4vr4xnSDxMaL",    // Sarah
  fr: "XrExE9yKIg1WjnnlVkGX",    // Matilda — French
  de: "XrExE9yKIg1WjnnlVkGX",    // Matilda — German
  "de-CH": "XrExE9yKIg1WjnnlVkGX",
  pt: "EXAVITQu4vr4xnSDxMaL",
  zh: "cgSgspJ2msm6clMCkdW9",    // Jessica — Mandarin tones
  ja: "cgSgspJ2msm6clMCkdW9",    // Jessica — Japanese
  ko: "cgSgspJ2msm6clMCkdW9",    // Jessica — Korean tonal range
  tr: "Xb7hH8MSUJpSbSDYk0k2",    // Alice — Turkish vowel harmony
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !data?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      return new Response(JSON.stringify({ error: "ElevenLabs API key not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const text: string = body?.text;
    const voiceId: string | undefined = body?.voiceId;
    const lang: string = (body?.lang || "en").split("-")[0].toLowerCase();
    const mode: "streaming" | "standard" = body?.mode === "standard" ? "standard" : "streaming";
    const industry: string | undefined = body?.industry;

    if (!text || typeof text !== "string" || text.length > 3000) {
      return new Response(JSON.stringify({ error: "Valid text required (max 3000 chars)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Per-industry kill switch: if industry passed and disabled, refuse.
    if (industry) {
      const { data: settings } = await supabase
        .from("voice_assistant_settings")
        .select("enabled, latency_mode, voice_id")
        .eq("industry", industry)
        .maybeSingle();
      if (settings && settings.enabled === false) {
        return new Response(JSON.stringify({ error: "Voice assistant disabled for this industry" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const voice = voiceId || VOICE_BY_LANG[lang] || VOICE_BY_LANG.en;

    // STREAMING mode: turbo + max latency optimization (~250-400ms first byte).
    // STANDARD mode: multilingual v2 non-stream (higher quality, ~1.5-3s).
    const isStreaming = mode === "streaming";
    const url = isStreaming
      ? `https://api.elevenlabs.io/v1/text-to-speech/${voice}/stream?output_format=mp3_22050_32&optimize_streaming_latency=4`
      : `https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_22050_32`;

    const modelId = isStreaming ? "eleven_turbo_v2_5" : "eleven_multilingual_v2";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true,
          speed: isStreaming ? 1.0 : 0.9,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text().catch(() => "");
      return new Response(JSON.stringify({ error: "TTS generation failed", detail: err.slice(0, 200) }), {
        status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Stream the body straight back to the client (no buffering on edge).
    if (isStreaming && response.body) {
      return new Response(response.body, {
        headers: {
          ...corsHeaders,
          "Content-Type": "audio/mpeg",
          "Cache-Control": "no-store",
          "X-TTS-Mode": "streaming",
          "X-TTS-Model": modelId,
        },
      });
    }

    const audioBuffer = await response.arrayBuffer();
    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=3600",
        "X-TTS-Mode": "standard",
        "X-TTS-Model": modelId,
      },
    });
  } catch (_err) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
