import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Settings2, CloudSun, Clock, BarChart3, Zap, Target, ChevronDown, ChevronUp } from "lucide-react";
import CrmWeatherWidget from "./CrmWeatherWidget";
import CrmGreetingBar from "./CrmGreetingBar";

interface WidgetConfig {
  greeting: boolean;
  weather: boolean;
  worldClock: boolean;
}

const STORAGE_KEY = "crm-widgets-config";

function loadConfig(): WidgetConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { greeting: true, weather: true, worldClock: true };
}

interface Props {
  displayName: string;
}

export default function CrmWidgetsPanel({ displayName }: Props) {
  const [config, setConfig] = useState<WidgetConfig>(loadConfig);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  const toggle = (key: keyof WidgetConfig) => {
    setConfig(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-3">
      {/* Widgets settings toggle */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings2 className="h-3.5 w-3.5" />
          Widgets
          {showSettings ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <Card className="border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-primary" /> Customize Widgets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <Label className="text-xs flex items-center gap-1.5 cursor-pointer">
                  <Zap className="h-3.5 w-3.5 text-amber-500" /> Greeting
                </Label>
                <Switch checked={config.greeting} onCheckedChange={() => toggle("greeting")} />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <Label className="text-xs flex items-center gap-1.5 cursor-pointer">
                  <CloudSun className="h-3.5 w-3.5 text-blue-400" /> Weather
                </Label>
                <Switch checked={config.weather} onCheckedChange={() => toggle("weather")} />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <Label className="text-xs flex items-center gap-1.5 cursor-pointer">
                  <Clock className="h-3.5 w-3.5 text-teal-500" /> World Clock
                </Label>
                <Switch checked={config.worldClock} onCheckedChange={() => toggle("worldClock")} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active widgets */}
      {config.greeting && <CrmGreetingBar displayName={displayName} showClock={config.worldClock} />}

      {config.weather && <CrmWeatherWidget />}
    </div>
  );
}
