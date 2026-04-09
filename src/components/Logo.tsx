import logoImg from "@/assets/logo-h-cal-4.png";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "hero";
  className?: string;
  showName?: boolean;
}

const sizeMap = {
  sm: "w-10 h-10",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-20 h-20",
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
      className={`${sizeMap[size]} rounded-xl object-contain`}
    />
    {showName && (
      <span className={`${textSizeMap[size]} font-bold text-foreground`}>
        HostFlow AI
      </span>
    )}
  </div>
);

export default Logo;
