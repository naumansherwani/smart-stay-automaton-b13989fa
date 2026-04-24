import { useEffect, useState } from "react";

/**
 * Premium multilingual trust strip — replaces the old
 * "AI-Powered Business Scheduling Platform" pill in the hero.
 *
 * Shows softly-animated country flags + a rotating localized
 * welcome line so visitors instantly feel the product speaks
 * their language.
 */

// 15 supported languages (Russia intentionally excluded per product decision).
const FLAGS = [
  "🇬🇧", "🇵🇰", "🇮🇳", "🇸🇦", "🇪🇸", "🇫🇷", "🇩🇪", "🇨🇭",
  "🇵🇹", "🇨🇳", "🇯🇵", "🇰🇷", "🇹🇷", "🇮🇹", "🇷🇴",
];

// Premium English taglines — rotate softly so visitors immediately understand the value.
const TAGLINES: string[] = [
  "The AI Operating System built for global businesses",
  "Run sales, support and operations in 15 languages — natively",
  "One AI command center. Every market. Every language.",
  "Premium AI CRM that speaks your customer's language",
];

const MultilingualTrustStrip = () => {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % TAGLINES.length), 3200);
    return () => clearInterval(id);
  }, []);

  const current = TAGLINES[idx];

  return (
    <div className="mx-auto inline-flex flex-col items-center gap-3 px-5 py-3 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl shadow-[0_0_30px_rgba(45,212,191,0.08)]">
      {/* Top: animated flag rail */}
      <div className="relative w-[260px] sm:w-[340px] overflow-hidden">
        <div className="flex gap-3 animate-[marquee_28s_linear_infinite] whitespace-nowrap will-change-transform">
          {[...FLAGS, ...FLAGS].map((f, i) => (
            <span
              key={i}
              className="text-xl sm:text-2xl select-none"
              style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.35))" }}
              aria-hidden
            >
              {f}
            </span>
          ))}
        </div>
        {/* Edge fades for premium feel */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[hsl(222,47%,8%)] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[hsl(222,47%,8%)] to-transparent" />
      </div>

      {/* Bottom: rotating premium tagline */}
      <div className="flex items-center gap-2 min-h-[22px]">
        <span className="text-[11px] font-semibold tracking-wider text-[hsl(174,62%,60%)] uppercase">
          15 Languages
        </span>
        <span className="w-1 h-1 rounded-full bg-white/30" />
        <span key={idx} className="text-sm text-white/85 font-medium animate-fade-in">
          {current}
        </span>
      </div>
    </div>
  );
};

export default MultilingualTrustStrip;