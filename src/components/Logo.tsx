import logoImg from "@/assets/logo-h-cal-4.png";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "hero";
  className?: string;
  showName?: boolean;
}

const sizeMap = {
  sm: "w-12 h-12",
  md: "w-16 h-16",
  lg: "w-20 h-20",
  xl: "w-24 h-24",
  "2xl": "w-28 h-28",
  hero: "w-40 h-40",
};

const textSizeMap = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-3xl",
  xl: "text-4xl",
  "2xl": "text-5xl",
  hero: "text-6xl",
};

const Logo = ({ size = "md", className, showName = false }: LogoProps) => (
  <div className={`flex items-center gap-4 ${className || ""}`}>
    <img
      src={logoImg}
      alt="HostFlow AI"
      className={`${sizeMap[size]} shrink-0 object-contain`}
      loading="lazy"
      width={1024}
      height={1024}
    />
    {showName && (
      <span className={`${textSizeMap[size]} font-bold text-foreground leading-none`}>
        HostFlow AI
      </span>
    )}
  </div>
);

export default Logo;
