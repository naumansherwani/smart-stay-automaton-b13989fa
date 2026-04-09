import logoImg from "@/assets/logo-h-cal-4.png";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "hero";
  className?: string;
  showName?: boolean;
}

const sizeMap = {
  sm: "w-10 h-10",
  md: "w-12 h-12",
  lg: "w-14 h-14",
  xl: "w-18 h-18",
  "2xl": "w-24 h-24",
  hero: "w-32 h-32",
};

const textSizeMap = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-3xl",
  "2xl": "text-4xl",
  hero: "text-5xl",
};

const Logo = ({ size = "md", className, showName = false }: LogoProps) => (
  <div className={`flex items-center gap-3 ${className || ""}`}>
    <img
      src={logoImg}
      alt="HostFlow AI"
      className={`${sizeMap[size]} shrink-0 object-contain`}
      loading="lazy"
      width={1024}
      height={1024}
    />
    {showName && (
      <span className={`${textSizeMap[size]} font-extrabold leading-none bg-gradient-to-r from-[hsl(174,62%,50%)] to-[hsl(213,97%,87%)] bg-clip-text text-transparent drop-shadow-[0_0_10px_hsl(174,62%,50%,0.5)]`}>
        HostFlow AI
      </span>
    )}
  </div>
);

export default Logo;
