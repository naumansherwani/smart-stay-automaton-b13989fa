import { useEffect, useState } from "react";
import { Check, Sparkles } from "lucide-react";

/**
 * Premium multilingual trust card — sits directly above the hero headline.
 * Real flag emojis + native greetings + elite SaaS color scheme.
 */

// Each country: real flag emoji + native greeting + tasteful accent color
const LANGUAGES: { flag: string; greeting: string; color: string; dir?: "rtl" }[] = [
  { flag: "🇬🇧", greeting: "Hello", color: "#93C5FD" },
  { flag: "🇵🇰", greeting: "خوش آمدید", color: "#86EFAC", dir: "rtl" },
  { flag: "🇸🇦", greeting: "أهلاً", color: "#86EFAC", dir: "rtl" },
  { flag: "🇪🇸", greeting: "Hola", color: "#FCD34D" },
  { flag: "🇫🇷", greeting: "Bonjour", color: "#93C5FD" },
  { flag: "🇩🇪", greeting: "Willkommen", color: "#FDE68A" },
  { flag: "🇨🇳", greeting: "欢迎", color: "#FCA5A5" },
  { flag: "🇯🇵", greeting: "ようこそ", color: "#F8FAFC" },
  { flag: "🇰🇷", greeting: "환영합니다", color: "#C7D2FE" },
  { flag: "🇷🇺", greeting: "Добро пожаловать", color: "#BFDBFE" },
  { flag: "🇮🇹", greeting: "Benvenuto", color: "#86EFAC" },
  { flag: "🇹🇷", greeting: "Hoşgeldiniz", color: "#FCA5A5" },
  { flag: "🇵🇹", greeting: "Bem-vindo", color: "#86EFAC" },
  { flag: "🇨🇭", greeting: "Grüezi", color: "#FCA5A5" },
];

const TRUST_BADGES = [
  "CRM Connected",
  "Voice AI Ready",
  "14 Languages",
  "Global Teams",
  "Fast Setup",
];

const MultilingualTrustStrip = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="mx-auto w-full max-w-[1050px]">
      <div
        className={`
          relative rounded-[26px] px-5 py-5 md:px-7 md:py-[22px]
          bg-[rgba(13,27,46,0.78)]
          border border-[#22D3EE]/30
          backdrop-blur-2xl
          shadow-[0_25px_70px_-20px_rgba(0,0,0,0.55),0_0_60px_-25px_rgba(34,211,238,0.22)]
          transition-all duration-700
          animate-[breathe_10s_ease-in-out_infinite]
          ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}
        `}
      >
        {/* subtle inner glow */}
        <div className="pointer-events-none absolute inset-0 rounded-[26px] bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.12),transparent_65%)]" />

        <div className="relative flex flex-col items-center gap-4 md:gap-5">
          {/* Row 1 + 2 — Real flags with native greetings underneath */}
          <div className="w-full">
            <ul className="flex flex-wrap items-start justify-center gap-x-[10px] gap-y-3 md:gap-x-[18px]">
              {LANGUAGES.map((l, i) => (
                <li
                  key={l.greeting + i}
                  className="flex flex-col items-center gap-1.5 select-none min-w-[52px] md:min-w-[64px]"
                >
                  <span
                    className="text-[24px] md:text-[32px] leading-none"
                    style={{
                      filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.5))",
                      display: "inline-block",
                      transformOrigin: "bottom center",
                      animation: `flagWave 3.6s ease-in-out ${(i % 6) * 0.2}s infinite`,
                    }}
                    aria-hidden
                  >
                    {l.flag}
                  </span>
                  <span
                    className="text-[9px] md:text-[11px] font-semibold leading-tight text-center whitespace-nowrap"
                    style={{ color: l.color, textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}
                    dir={l.dir}
                  >
                    {l.greeting}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Divider */}
          <div className="h-px w-2/3 bg-gradient-to-r from-transparent via-[#22D3EE]/25 to-transparent" />

          {/* Row 3 — Main message */}
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#FBBF24]" />
            <p className="text-base md:text-lg font-bold text-[#F8FAFC] text-center">
              Your AI CRM Speaks{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#67E8F9] via-[#22D3EE] to-[#67E8F9]">
                Your Customer's Language
              </span>
            </p>
          </div>

          {/* Row 4 — Value line */}
          <p className="text-[13px] md:text-sm text-[#94A3B8] text-center max-w-[720px] leading-relaxed">
            From leads, bookings, WhatsApp, support, calendars, and payments — HostFlow AI helps run your business naturally in 14 languages.
          </p>

          {/* Row 5 — Trust badges */}
          <ul className="flex flex-wrap items-center justify-center gap-2">
            {TRUST_BADGES.map((b) => (
              <li
                key={b}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[rgba(7,17,31,0.6)] border border-[#22D3EE]/20 text-[11px] md:text-xs font-semibold text-[#F8FAFC]/85 backdrop-blur-sm hover:bg-[rgba(7,17,31,0.85)] hover:border-[#22D3EE]/50 hover:-translate-y-0.5 transition-all duration-200"
              >
                <Check className="w-3 h-3 text-[#10B981]" />
                {b}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Local keyframes for waving flags + breathing card */}
      <style>{`
        @keyframes flagWave {
          0%, 100% { transform: rotate(0deg) translateY(0); }
          25% { transform: rotate(-4deg) translateY(-1px); }
          50% { transform: rotate(0deg) translateY(-2px); }
          75% { transform: rotate(4deg) translateY(-1px); }
        }
        @keyframes breathe {
          0%, 100% { box-shadow: 0 25px 70px -20px rgba(0,0,0,0.55), 0 0 55px -25px rgba(34,211,238,0.20); }
          50% { box-shadow: 0 25px 70px -20px rgba(0,0,0,0.55), 0 0 70px -22px rgba(34,211,238,0.30); }
        }
      `}</style>
    </div>
  );
};

export default MultilingualTrustStrip;
