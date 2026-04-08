import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INDUSTRY_CONFIGS, type IndustryType } from "@/lib/industryConfig";
import IndustryIcon from "./IndustryIcon";

interface IndustrySwitcherProps {
  current: IndustryType;
  onChange: (industry: IndustryType) => void;
}

const IndustrySwitcher = ({ current, onChange }: IndustrySwitcherProps) => {
  const config = INDUSTRY_CONFIGS[current];

  return (
    <Select value={current} onValueChange={v => onChange(v as IndustryType)}>
      <SelectTrigger className="w-[260px] bg-card border-border">
        <SelectValue>
          <span className="flex items-center gap-2">
            <IndustryIcon industry={current} size={18} />
            <span className="font-medium">{config.label}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.values(INDUSTRY_CONFIGS).map(c => (
          <SelectItem key={c.id} value={c.id}>
            <span className="flex items-center gap-2">
              <IndustryIcon industry={c.id} size={16} />
              <span>{c.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default IndustrySwitcher;
