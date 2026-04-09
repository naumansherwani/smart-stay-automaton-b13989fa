import logoImg from "@/assets/logo-h-cal-4.png";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  sm: "w-10 h-10",
  md: "w-12 h-12",
  lg: "w-14 h-14",
  xl: "w-20 h-20",
};

const Logo = ({ size = "sm", className }: LogoProps) => (
  <img
    src={logoImg}
    alt="HostFlow AI"
    className={`${sizeMap[size]} rounded-lg ${className || ""}`}
  />
);

export default Logo;
