import {
  Globe, Plane, Car, Hospital, GraduationCap, Package,
  Theater, TrainFront
} from "lucide-react";
import { getIndustryConfig, type IndustryType } from "@/lib/industryConfig";

const ICON_MAP: Record<IndustryType, React.ElementType> = {
  hospitality: Globe,
  airlines: Plane,
  car_rental: Car,
  healthcare: Hospital,
  education: GraduationCap,
  logistics: Package,
  events_entertainment: Theater,
  railways: TrainFront,
};

interface IndustryIconProps {
  industry: IndustryType;
  size?: number;
  className?: string;
}

const IndustryIcon = ({ industry, size = 18, className }: IndustryIconProps) => {
  const IconComponent = ICON_MAP[industry] || Globe;
  const color = getIndustryConfig(industry).color;

  return <IconComponent size={size} color={color} className={className} />;
};

export default IndustryIcon;
