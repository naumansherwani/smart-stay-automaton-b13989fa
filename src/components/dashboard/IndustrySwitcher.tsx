import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INDUSTRY_CONFIGS, type IndustryType } from "@/lib/industryConfig";

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
            <span>{config.icon}</span>
            <span className="font-medium">{config.label}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.values(INDUSTRY_CONFIGS).map(c => (
          <SelectItem key={c.id} value={c.id}>
            <span className="flex items-center gap-2">
              <span>{c.icon}</span>
              <span>{c.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default IndustrySwitcher;
