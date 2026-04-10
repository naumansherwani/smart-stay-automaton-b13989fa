import { useEffect, useState } from "react";
import { Globe } from "lucide-react";

const WORLD_CLOCKS = [
  { label: "NYC", tz: "America/New_York" },
  { label: "LON", tz: "Europe/London" },
  { label: "DXB", tz: "Asia/Dubai" },
  { label: "TKY", tz: "Asia/Tokyo" },
  { label: "SYD", tz: "Australia/Sydney" },
];

function getGreeting(hour: number) {
  if (hour < 12) return { text: "Good Morning", emoji: "☀️" };
  if (hour < 17) return { text: "Good Afternoon", emoji: "🌤️" };
  return { text: "Good Evening", emoji: "🌙" };
}

function formatTime(tz: string) {
  return new Date().toLocaleTimeString("en-US", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

interface Props {
  displayName: string;
}

export default function CrmGreetingBar({ displayName }: Props) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const greeting = getGreeting(now.getHours());
  const firstName = displayName.split(/\s+/)[0];

  return (
    <div className="rounded-lg border bg-gradient-to-r from-primary/5 via-primary/10 to-accent/5 px-4 py-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{greeting.emoji}</span>
          <h2 className="text-lg font-semibold text-foreground">
            {greeting.text}, <span className="text-primary">{firstName}</span>!
          </h2>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <Globe className="h-3.5 w-3.5 shrink-0" />
          {WORLD_CLOCKS.map((c) => (
            <div key={c.label} className="flex flex-col items-center leading-tight">
              <span className="font-medium text-foreground">{formatTime(c.tz)}</span>
              <span>{c.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
