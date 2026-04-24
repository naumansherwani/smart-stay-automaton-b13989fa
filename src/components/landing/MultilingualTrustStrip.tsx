import { useEffect, useState } from "react";
import { Check, Sparkles } from "lucide-react";

/**
 * Premium multilingual trust card — sits directly above the hero headline.
 * Communicates: "This AI works in my language, connects with my business,
 * is premium and trusted, and runs CRM + leads + bookings + ops."
 */

const LANGUAGES: { flag: string; code: string }[] = [
  { flag: "🇬🇧", code: "EN" },
  { flag: "🇵🇰", code: "UR" },
  { flag: "🇸🇦", code: "AR" },
  { flag: "🇪🇸", code: "ES" },
  { flag: "🇫🇷", code: "FR" },
  { flag: "🇩🇪", code: "DE" },
  { flag: "🇨🇳", code: "ZH" },
  { flag: "🇯🇵", code: "JA" },
  { flag: "🇰🇷", code: "KO" },
  { flag: "🇷🇺", code: "RU" },
  { flag: "🇮🇹", code: "IT" },
  { flag: "🇹🇷", code: "TR" },
  { flag: "🇮🇳", code: "HI" },
  { flag: "🇵🇹", code: "PT" },
  { flag: "🇨🇭", code: "CH" },
];

const TRUST_BADGES = [
  "CRM Connected",
  "Voice AI Ready",
  "Local Language Support",
  "Global Business Ready",
  "Fast Setup",
];

const MultilingualTrustStrip = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="mx-auto w-full max-w-[980px]">
      <div
        className={`
          relative rounded-[24px] px-5 py-5 md:px-8 md:py-[18px]
          bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]
          border border-[hsl(174,62%,50%)]/25
          backdrop-blur-2xl
          shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6),0_0_60px_-15px_rgba(45,212,191,0.25)]
          transition-all duration-700
          ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}
        `}
      >
        {/* subtle inner glow */}
        <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-[radial-gradient(ellipse_at_top,rgba(45,212,191,0.10),transparent_60%)]" />

        <div className="relative flex flex-col items-center gap-4 md:gap-5">
          {/* Row 1 — Flags + language codes */}
          <div className="w-full">
            <ul className="flex flex-wrap items-start justify-center gap-x-3 gap-y-3 md:gap-x-[14px]">
              {LANGUAGES.map((l, i) => (
                <li
                  key={l.code}
                  className="flex flex-col items-center gap-1 select-none"
                  style={{
                    animation: `floatY 4.5s ease-in-out ${(i % 5) * 0.25}s infinite`,
                  }}
                >
                  <span
                    className="text-[22px] md:text-[24px] leading-none"
                    style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.45))" }}
                    aria-hidden
                  >
                    {l.flag}
                  </span>
                  <span className="text-[10px] md:text-[11px] font-bold tracking-[0.08em] text-white/65">
                    {l.code}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Divider */}
          <div className="h-px w-2/3 bg-gradient-to-r from-transparent via-white/15 to-transparent" />

          {/* Row 2 — Main message */}
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[hsl(174,62%,55%)]" />
            <p className="text-base md:text-lg font-bold text-white text-center">
              Your AI CRM Speaks{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(174,62%,55%)] via-[hsl(190,80%,60%)] to-[hsl(217,91%,65%)]">
                Your Customer's Language
              </span>
            </p>
          </div>

          {/* Row 3 — Value line */}
          <p className="text-[13px] md:text-sm text-white/65 text-center max-w-[680px] leading-relaxed">
            Connect leads, bookings, WhatsApp, calendars, teams, and customers into one AI system that works in 15 languages.
          </p>

          {/* Row 4 — Trust badges */}
          <ul className="flex flex-wrap items-center justify-center gap-2">
            {TRUST_BADGES.map((b) => (
              <li
                key={b}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-[11px] md:text-xs font-semibold text-white/80 backdrop-blur-sm hover:bg-white/[0.08] hover:border-[hsl(174,62%,50%)]/30 transition-colors"
              >
                <Check className="w-3 h-3 text-[hsl(174,62%,55%)]" />
                {b}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Local keyframes for the soft floating effect */}
      <style>{`
        @keyframes floatY {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
      `}</style>
    </div>
  );
};

export default MultilingualTrustStrip;
