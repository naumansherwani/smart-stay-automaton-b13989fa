import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfile } from "@/hooks/useProfile";
import { useAvatarSignedUrl } from "@/hooks/useAvatarSignedUrl";
import { ADVISORS } from "@/components/advisor/advisorConfig";
import type { IndustryType } from "@/lib/industryConfig";
import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

export type HaloPulse = "idle" | "streaming" | "sherlock" | "resolved";

interface UserHaloProps {
  /** Diameter in px of the avatar disc. Halo extends 4px beyond. */
  size?: number;
  /** Override industry; defaults to active workspace industry from profile. */
  industry?: IndustryType;
  /** Animation state of the glow ring. */
  pulse?: HaloPulse;
  /** Show small gold Crown badge in the corner (owner / founder surfaces). */
  founderBadge?: boolean;
  /** Click handler — when omitted, halo is non-interactive. */
  onClick?: () => void;
  className?: string;
  title?: string;
}

/**
 * UserHalo — the single identity primitive used app-wide.
 *
 * - Reads the authenticated user's private profile photo (signed URL).
 * - Wraps it in an industry-coloured "neural halo" ring whose color
 *   comes from `advisorConfig[industry].auraHsl`.
 * - Animations: breathing pulse idle, faster pulse streaming, gold
 *   flash on Sherlock, green pulse on resolved.
 * - Optional Crown badge (founder surfaces only).
 * - Fallback: user initials if no photo exists.
 *
 * Privacy: never embeds the raw storage path. Only short-lived signed URLs.
 */
export default function UserHalo({
  size = 36,
  industry,
  pulse = "idle",
  founderBadge = false,
  onClick,
  className,
  title,
}: UserHaloProps) {
  const { profile } = useProfile();
  const signedUrl = useAvatarSignedUrl(profile?.avatar_path ?? null);

  const effectiveIndustry: IndustryType =
    industry || (profile?.industry as IndustryType) || "hospitality";
  const advisor = ADVISORS[effectiveIndustry];
  const auraHsl = advisor?.auraHsl || "168 70% 45%";

  const initials = useMemo(() => {
    const name = profile?.display_name || "";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [profile?.display_name]);

  // Halo animation class — one of the keyframes defined in index.css.
  const haloAnim =
    pulse === "streaming"
      ? "animate-[halo-pulse_1.2s_ease-in-out_infinite]"
      : pulse === "sherlock"
      ? "animate-[halo-gold-flash_1.6s_ease-in-out_infinite]"
      : pulse === "resolved"
      ? "animate-[halo-green-pulse_1.8s_ease-in-out_infinite]"
      : "animate-[halo-breath_3.2s_ease-in-out_infinite]";

  // Pulse override: gold for sherlock, green for resolved.
  const ringColor =
    pulse === "sherlock"
      ? "45 95% 60%"
      : pulse === "resolved"
      ? "142 70% 50%"
      : auraHsl;

  const fallbackUrl = profile?.avatar_url || undefined;
  const src = signedUrl || fallbackUrl;
  const interactive = !!onClick;

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={!interactive}
      className={cn(
        "relative inline-flex items-center justify-center rounded-full p-[2px] shrink-0 transition-transform",
        interactive && "hover:scale-105 cursor-pointer",
        !interactive && "cursor-default",
        className,
      )}
      style={{
        width: size + 6,
        height: size + 6,
        // Glassmorphism ring backdrop.
        background: `radial-gradient(circle, hsl(${ringColor} / 0.45) 0%, hsl(${ringColor} / 0.15) 60%, transparent 75%)`,
      }}
    >
      {/* Animated glow halo */}
      <span
        aria-hidden
        className={cn("absolute inset-0 rounded-full pointer-events-none", haloAnim)}
        style={{
          boxShadow: `0 0 ${size * 0.55}px hsl(${ringColor} / 0.65), 0 0 ${size * 0.3}px hsl(${ringColor} / 0.4) inset`,
        }}
      />
      {/* The avatar itself */}
      <Avatar
        className="relative z-[1] ring-1 ring-white/15 shadow-md"
        style={{ width: size, height: size }}
      >
        {src && <AvatarImage src={src} alt="Profile" />}
        <AvatarFallback
          className="text-xs font-semibold bg-gradient-to-br from-background to-card text-foreground"
        >
          {initials}
        </AvatarFallback>
      </Avatar>
      {/* Optional founder crown badge — appears only on owner-facing surfaces */}
      {founderBadge && (
        <span
          aria-label="Founder"
          className="absolute -bottom-0.5 -right-0.5 z-[2] inline-flex items-center justify-center rounded-full bg-gradient-to-br from-[#F59E0B] to-[#FACC15] shadow-md ring-2 ring-background"
          style={{ width: Math.max(14, size * 0.38), height: Math.max(14, size * 0.38) }}
        >
          <Crown className="text-[#0B1120]" style={{ width: Math.max(8, size * 0.22), height: Math.max(8, size * 0.22) }} />
        </span>
      )}
    </button>
  );
}