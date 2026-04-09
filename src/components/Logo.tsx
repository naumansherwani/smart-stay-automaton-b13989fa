import logoImg from "@/assets/logo-option-2.png";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
};

const Logo = ({ size = "sm", className }: LogoProps) => (
  <img
    src={logoImg}
    alt="HostFlow AI"
    className={`${sizeMap[size]} rounded-lg ${className || ""}`}
  />
);

export default Logo;
