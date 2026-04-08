import {
  Globe, Plane, Car, Hospital, GraduationCap, Package,
  Theater, Dumbbell, Scale, Building, Landmark, Ship, Building2
} from "lucide-react";
import type { IndustryType } from "@/lib/industryConfig";

const ICON_MAP: Record<IndustryType, React.ElementType> = {
  hospitality: Globe,
  airlines: Plane,
  car_rental: Car,
  healthcare: Hospital,
  education: GraduationCap,
  logistics: Package,
  events_entertainment: Theater,
  fitness_wellness: Dumbbell,
  legal_services: Scale,
  real_estate: Building,
  coworking: Building2,
  marine_maritime: Ship,
  government: Landmark,
};

const COLOR_MAP: Record<IndustryType, string> = {
  hospitality: "#0d9488",
  airlines: "#3b82f6",
  car_rental: "#0ea5e9",
  healthcare: "#ef4444",
  education: "#8b5cf6",
  logistics: "#f97316",
  events_entertainment: "#d946ef",
  fitness_wellness: "#22c55e",
  legal_services: "#eab308",
  real_estate: "#f97316",
  coworking: "#06b6d4",
  marine_maritime: "#3b82f6",
  government: "#6366f1",
};

interface IndustryIconProps {
  industry: IndustryType;
  size?: number;
  className?: string;
}

const IndustryIcon = ({ industry, size = 18, className }: IndustryIconProps) => {
  const IconComponent = ICON_MAP[industry] || Globe;
  const color = COLOR_MAP[industry] || "#3b82f6";

  return <IconComponent size={size} color={color} className={className} />;
};

export default IndustryIcon;
