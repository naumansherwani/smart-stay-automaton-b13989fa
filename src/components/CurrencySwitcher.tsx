import { useCurrency, CURRENCIES } from "@/hooks/useCurrency";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Coins } from "lucide-react";

interface CurrencySwitcherProps {
  className?: string;
  compact?: boolean;
}

const CurrencySwitcher = ({ className = "", compact = false }: CurrencySwitcherProps) => {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {!compact && <Coins className="w-4 h-4 text-muted-foreground" />}
      <Select value={currency} onValueChange={setCurrency}>
        <SelectTrigger className="h-9 w-[120px] bg-card/60 border-border/60 backdrop-blur-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-popover">
          {CURRENCIES.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              <span className="font-semibold">{c.code}</span>
              <span className="text-muted-foreground ml-2">{c.symbol.trim()}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CurrencySwitcher;