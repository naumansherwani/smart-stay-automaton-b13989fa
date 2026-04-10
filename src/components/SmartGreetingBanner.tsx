import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin, Droplets, Wind, Thermometer, Sun, CloudRain, Cloud, CloudSnow,
  CloudLightning, CloudDrizzle, Sunrise, Sunset, Globe, RefreshCw,
  ChevronDown, ChevronUp,
} from "lucide-react";

/* ─── Types ─── */
interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  weatherCode: number;
  isDay: boolean;
  uvIndex: number;
  hourly: { time: string; temp: number; code: number; precip: number }[];
  daily: { date: string; maxTemp: number; minTemp: number; code: number; precipProb: number; sunrise: string; sunset: string }[];
  city: string;
  country: string;
}

/* ─── WMO weather codes ─── */
const WMO: Record<number, { label: string; emoji: string }> = {
  0: { label: "Clear Sky", emoji: "☀️" },
  1: { label: "Mostly Clear", emoji: "🌤️" },
  2: { label: "Partly Cloudy", emoji: "⛅" },
  3: { label: "Overcast", emoji: "☁️" },
  45: { label: "Foggy", emoji: "🌫️" },
  48: { label: "Rime Fog", emoji: "🌫️" },
  51: { label: "Light Drizzle", emoji: "🌦️" },
  53: { label: "Drizzle", emoji: "🌦️" },
  55: { label: "Heavy Drizzle", emoji: "🌧️" },
  61: { label: "Light Rain", emoji: "🌧️" },
  63: { label: "Rain", emoji: "🌧️" },
  65: { label: "Heavy Rain", emoji: "⛈️" },
  71: { label: "Light Snow", emoji: "🌨️" },
  73: { label: "Snow", emoji: "❄️" },
  75: { label: "Heavy Snow", emoji: "❄️" },
  80: { label: "Rain Showers", emoji: "🌦️" },
  81: { label: "Moderate Showers", emoji: "🌧️" },
  82: { label: "Heavy Showers", emoji: "⛈️" },
  95: { label: "Thunderstorm", emoji: "⛈️" },
  96: { label: "Thunderstorm + Hail", emoji: "⛈️" },
  99: { label: "Heavy Thunderstorm", emoji: "🌩️" },
};
const getWmo = (c: number) => WMO[c] || WMO[0];

/* ─── World clocks ─── */
const CLOCKS = [
  { city: "New York", tz: "America/New_York", flag: "🇺🇸" },
  { city: "London", tz: "Europe/London", flag: "🇬🇧" },
  { city: "Dubai", tz: "Asia/Dubai", flag: "🇦🇪" },
  { city: "Tokyo", tz: "Asia/Tokyo", flag: "🇯🇵" },
  { city: "Sydney", tz: "Australia/Sydney", flag: "🇦🇺" },
  { city: "Karachi", tz: "Asia/Karachi", flag: "🇵🇰" },
];

function formatClock(tz: string) {
  return new Date().toLocaleTimeString("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: true });
}

function getGreeting(hour: number) {
  if (hour < 5) return { text: "Good Night", emoji: "🌙", gradient: "from-indigo-500/20 to-purple-500/20" };
  if (hour < 12) return { text: "Good Morning", emoji: "☀️", gradient: "from-amber-500/20 to-orange-500/20" };
  if (hour < 17) return { text: "Good Afternoon", emoji: "🌤️", gradient: "from-sky-500/20 to-blue-500/20" };
  if (hour < 21) return { text: "Good Evening", emoji: "🌅", gradient: "from-orange-500/20 to-rose-500/20" };
  return { text: "Good Night", emoji: "🌙", gradient: "from-indigo-500/20 to-purple-500/20" };
}

function windDir(deg: number) {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

/* ─── Component ─── */
interface Props {
  userName?: string;
  compact?: boolean;
}

export default function SmartGreetingBanner({ userName, compact = false }: Props) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [expanded, setExpanded] = useState(false);

  // Update clocks every 30s
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const fetchWeather = useCallback(async () => {
    setLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
      });
      const { latitude: lat, longitude: lon } = pos.coords;

      // Reverse geocode
      let city = "Your Location";
      let country = "";
      try {
        const nomRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10&accept-language=en`
        );
        if (nomRes.ok) {
          const nomData = await nomRes.json();
          city = nomData.address?.city || nomData.address?.town || nomData.address?.state || "Your Location";
          country = nomData.address?.country || "";
        }
      } catch { /* fallback */ }

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,is_day,uv_index&hourly=temperature_2m,weather_code,precipitation_probability&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,sunrise,sunset&timezone=auto&forecast_days=7`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const c = data.current;

      setWeather({
        temperature: c.temperature_2m,
        feelsLike: c.apparent_temperature,
        humidity: c.relative_humidity_2m,
        windSpeed: c.wind_speed_10m,
        windDirection: c.wind_direction_10m,
        weatherCode: c.weather_code,
        isDay: c.is_day === 1,
        uvIndex: c.uv_index,
        hourly: data.hourly.time.slice(0, 24).map((t: string, i: number) => ({
          time: t, temp: data.hourly.temperature_2m[i], code: data.hourly.weather_code[i], precip: data.hourly.precipitation_probability[i],
        })),
        daily: data.daily.time.map((d: string, i: number) => ({
          date: d, maxTemp: data.daily.temperature_2m_max[i], minTemp: data.daily.temperature_2m_min[i],
          code: data.daily.weather_code[i], precipProb: data.daily.precipitation_probability_max[i],
          sunrise: data.daily.sunrise[i], sunset: data.daily.sunset[i],
        })),
        city,
        country,
      });
    } catch {
      setWeather(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  const greeting = getGreeting(now.getHours());
  const firstName = userName?.split(/\s+/)[0] || "there";
  const wmo = weather ? getWmo(weather.weatherCode) : null;
  const currentHour = now.getHours();
  const next6Hours = weather?.hourly.filter((_, i) => i >= currentHour && i < currentHour + 6) || [];

  return (
    <div className="space-y-0">
      {/* ─── Main Greeting + Weather Card ─── */}
      <Card className="overflow-hidden border-primary/10 shadow-lg">
        <CardContent className="p-0">
          {/* Top greeting bar */}
          <div className={`relative px-4 sm:px-6 py-4 bg-gradient-to-r ${greeting.gradient}`}>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.06),transparent_60%)]" />
            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {/* Greeting */}
              <div className="flex items-center gap-3">
                <span className="text-3xl sm:text-4xl">{greeting.emoji}</span>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                    {greeting.text}, <span className="text-primary">{firstName}</span>!
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </div>

              {/* Mini weather */}
              {weather && wmo && (
                <div className="flex items-center gap-3 bg-background/60 backdrop-blur-sm rounded-xl px-3 py-2 border border-border/30">
                  <span className="text-2xl">{wmo.emoji}</span>
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-foreground">{Math.round(weather.temperature)}°C</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <MapPin className="h-2.5 w-2.5" />
                      <span>{weather.city}{weather.country ? `, ${weather.country}` : ""}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={fetchWeather}>
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>
              )}
              {loading && !weather && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Detecting location…
                </div>
              )}
            </div>
          </div>

          {/* World clock row */}
          <div className="px-4 sm:px-6 py-3 border-t border-border/30 bg-background/40 backdrop-blur-sm">
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
              <Globe className="h-4 w-4 text-primary shrink-0" />
              {CLOCKS.map((c) => (
                <div
                  key={c.tz}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors min-w-fit"
                >
                  <span className="text-sm">{c.flag}</span>
                  <div className="leading-tight">
                    <p className="text-[10px] text-muted-foreground">{c.city}</p>
                    <p className="text-xs font-semibold text-foreground">{formatClock(c.tz)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Expandable weather details */}
          {weather && (
            <>
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-center gap-1 py-1.5 text-[10px] text-muted-foreground hover:text-foreground border-t border-border/30 transition-colors"
              >
                {expanded ? "Hide" : "Show"} Weather Details
                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>

              {expanded && (
                <div className="border-t border-border/30">
                  {/* Weather stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4">
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/30">
                      <Thermometer className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">Feels Like</p>
                        <p className="text-xs font-semibold">{Math.round(weather.feelsLike)}°C</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/30">
                      <Droplets className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">Humidity</p>
                        <p className="text-xs font-semibold">{weather.humidity}%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/30">
                      <Wind className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">Wind</p>
                        <p className="text-xs font-semibold">{Math.round(weather.windSpeed)} km/h {windDir(weather.windDirection)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/30">
                      <Sun className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">UV Index</p>
                        <p className="text-xs font-semibold">{weather.uvIndex} {weather.uvIndex <= 2 ? "Low" : weather.uvIndex <= 5 ? "Moderate" : "High"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Sunrise/Sunset */}
                  {weather.daily[0] && (
                    <div className="flex items-center justify-center gap-8 px-4 pb-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Sunrise className="h-4 w-4 text-amber-400" />
                        <span>{new Date(weather.daily[0].sunrise).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Sunset className="h-4 w-4 text-orange-400" />
                        <span>{new Date(weather.daily[0].sunset).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    </div>
                  )}

                  {/* Hourly */}
                  <div className="px-4 py-3 border-t border-border/30">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Next Hours</p>
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {next6Hours.map((h, i) => (
                        <div key={i} className="flex flex-col items-center gap-0.5 min-w-[3.2rem] p-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                          <span className="text-[10px] text-muted-foreground">{new Date(h.time).getHours()}:00</span>
                          <span className="text-base">{getWmo(h.code).emoji}</span>
                          <span className="text-xs font-semibold">{Math.round(h.temp)}°</span>
                          {h.precip > 0 && (
                            <span className="text-[9px] text-blue-400">{h.precip}%</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 7-day */}
                  <div className="px-4 py-3 border-t border-border/30">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">7-Day Forecast</p>
                    <div className="space-y-1">
                      {weather.daily.map((d, i) => {
                        const dayName = i === 0 ? "Today" : new Date(d.date).toLocaleDateString([], { weekday: "short" });
                        return (
                          <div key={i} className="flex items-center gap-2 py-1 px-1.5 rounded-lg hover:bg-muted/30 transition-colors">
                            <span className="text-xs w-10 text-muted-foreground">{dayName}</span>
                            <span className="text-sm">{getWmo(d.code).emoji}</span>
                            <span className="text-[10px] text-muted-foreground flex-1 hidden sm:block">{getWmo(d.code).label}</span>
                            {d.precipProb > 0 && (
                              <Badge variant="outline" className="text-[9px] px-1 py-0 text-blue-400 border-blue-400/20">
                                <Droplets className="h-2.5 w-2.5 mr-0.5" />{d.precipProb}%
                              </Badge>
                            )}
                            <div className="flex items-center gap-1 text-xs">
                              <span className="font-semibold">{Math.round(d.maxTemp)}°</span>
                              <span className="text-muted-foreground">{Math.round(d.minTemp)}°</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
