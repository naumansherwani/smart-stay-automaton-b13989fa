import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, MapPin, Droplets, Wind, Eye, Thermometer, Sun, CloudRain, Cloud, CloudSnow, CloudLightning, CloudDrizzle, Sunrise, Sunset, ChevronDown, ChevronUp } from "lucide-react";

interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  visibility: number;
  weatherCode: number;
  isDay: boolean;
  uvIndex: number;
  precipProb: number;
  hourly: { time: string; temp: number; code: number; precip: number }[];
  daily: { date: string; maxTemp: number; minTemp: number; code: number; precipProb: number; sunrise: string; sunset: string }[];
  city: string;
}

const WMO_CODES: Record<number, { label: string; icon: React.ReactNode }> = {
  0: { label: "Clear Sky", icon: <Sun className="h-8 w-8 text-amber-400" /> },
  1: { label: "Mostly Clear", icon: <Sun className="h-8 w-8 text-amber-400" /> },
  2: { label: "Partly Cloudy", icon: <Cloud className="h-8 w-8 text-muted-foreground" /> },
  3: { label: "Overcast", icon: <Cloud className="h-8 w-8 text-muted-foreground" /> },
  45: { label: "Foggy", icon: <Cloud className="h-8 w-8 text-muted-foreground/60" /> },
  48: { label: "Rime Fog", icon: <Cloud className="h-8 w-8 text-muted-foreground/60" /> },
  51: { label: "Light Drizzle", icon: <CloudDrizzle className="h-8 w-8 text-blue-400" /> },
  53: { label: "Drizzle", icon: <CloudDrizzle className="h-8 w-8 text-blue-400" /> },
  55: { label: "Heavy Drizzle", icon: <CloudDrizzle className="h-8 w-8 text-blue-500" /> },
  61: { label: "Light Rain", icon: <CloudRain className="h-8 w-8 text-blue-400" /> },
  63: { label: "Rain", icon: <CloudRain className="h-8 w-8 text-blue-500" /> },
  65: { label: "Heavy Rain", icon: <CloudRain className="h-8 w-8 text-blue-600" /> },
  71: { label: "Light Snow", icon: <CloudSnow className="h-8 w-8 text-sky-300" /> },
  73: { label: "Snow", icon: <CloudSnow className="h-8 w-8 text-sky-400" /> },
  75: { label: "Heavy Snow", icon: <CloudSnow className="h-8 w-8 text-sky-500" /> },
  80: { label: "Rain Showers", icon: <CloudRain className="h-8 w-8 text-blue-400" /> },
  81: { label: "Moderate Showers", icon: <CloudRain className="h-8 w-8 text-blue-500" /> },
  82: { label: "Heavy Showers", icon: <CloudRain className="h-8 w-8 text-blue-600" /> },
  95: { label: "Thunderstorm", icon: <CloudLightning className="h-8 w-8 text-yellow-500" /> },
  96: { label: "Thunderstorm + Hail", icon: <CloudLightning className="h-8 w-8 text-yellow-600" /> },
  99: { label: "Heavy Thunderstorm", icon: <CloudLightning className="h-8 w-8 text-red-500" /> },
};

function getWeatherInfo(code: number) {
  return WMO_CODES[code] || WMO_CODES[0];
}

function getSmallIcon(code: number) {
  const info = getWeatherInfo(code);
  const el = info.icon as React.ReactElement;
  return { ...el, props: { ...el.props, className: "h-4 w-4" } };
}

function windDir(deg: number) {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

export default function CrmWeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const fetchWeather = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Get user location
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
      });
      const { latitude: lat, longitude: lon } = pos.coords;

      // Reverse geocode for city name
      let city = "Your Location";
      try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=&latitude=${lat}&longitude=${lon}&count=1`);
        // Use nominatim as fallback
        const nomRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`);
        if (nomRes.ok) {
          const nomData = await nomRes.json();
          city = nomData.address?.city || nomData.address?.town || nomData.address?.state || "Your Location";
        }
      } catch { /* keep default */ }

      // Fetch weather from Open-Meteo (free, no API key)
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,is_day,uv_index,precipitation_probability&hourly=temperature_2m,weather_code,precipitation_probability&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,sunrise,sunset&timezone=auto&forecast_days=7`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Weather API error");
      const data = await res.json();

      const c = data.current;
      const hourlySlice = data.hourly.time.slice(0, 24).map((t: string, i: number) => ({
        time: t,
        temp: data.hourly.temperature_2m[i],
        code: data.hourly.weather_code[i],
        precip: data.hourly.precipitation_probability[i],
      }));

      const dailySlice = data.daily.time.map((d: string, i: number) => ({
        date: d,
        maxTemp: data.daily.temperature_2m_max[i],
        minTemp: data.daily.temperature_2m_min[i],
        code: data.daily.weather_code[i],
        precipProb: data.daily.precipitation_probability_max[i],
        sunrise: data.daily.sunrise[i],
        sunset: data.daily.sunset[i],
      }));

      setWeather({
        temperature: c.temperature_2m,
        feelsLike: c.apparent_temperature,
        humidity: c.relative_humidity_2m,
        windSpeed: c.wind_speed_10m,
        windDirection: c.wind_direction_10m,
        visibility: 10, // Open-Meteo doesn't always provide
        weatherCode: c.weather_code,
        isDay: c.is_day === 1,
        uvIndex: c.uv_index,
        precipProb: c.precipitation_probability ?? 0,
        hourly: hourlySlice,
        daily: dailySlice,
        city,
      });
    } catch (err: any) {
      if (err?.code === 1) {
        setError("Location access denied. Enable location to see weather.");
      } else {
        setError("Unable to load weather data.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 15 * 60 * 1000); // refresh every 15 min
    return () => clearInterval(interval);
  }, [fetchWeather]);

  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-muted animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-3 w-24 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !weather) {
    return (
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-sm text-muted-foreground">{error || "Weather unavailable"}</p>
          <Button variant="ghost" size="sm" className="mt-2" onClick={fetchWeather}>
            <RefreshCw className="h-3 w-3 mr-1" /> Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const info = getWeatherInfo(weather.weatherCode);
  const now = new Date();
  const currentHour = now.getHours();
  const next8Hours = weather.hourly.filter((_, i) => i >= currentHour && i < currentHour + 8);
  const todaySunrise = weather.daily[0]?.sunrise;
  const todaySunset = weather.daily[0]?.sunset;

  return (
    <Card className="overflow-hidden border-primary/10">
      <CardContent className="p-0">
        {/* Main weather display - always visible */}
        <div className="p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-background/80 backdrop-blur-sm shadow-sm">
                {info.icon}
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-foreground">{Math.round(weather.temperature)}°</span>
                  <span className="text-sm text-muted-foreground">C</span>
                </div>
                <p className="text-sm font-medium text-foreground/80">{info.label}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <MapPin className="h-3 w-3" />
                <span>{weather.city}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={fetchWeather}>
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Show/Hide Weather Details toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1 py-1.5 text-[10px] text-muted-foreground hover:text-foreground border-t border-border/30 transition-colors"
        >
          {expanded ? "Hide" : "Show"} Weather Details
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        {/* Expandable details */}
        {expanded && (
          <div className="border-t border-border/30">
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4">
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-background/60 backdrop-blur-sm">
                <Thermometer className="h-3.5 w-3.5 text-orange-400" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Feels Like</p>
                  <p className="text-xs font-semibold">{Math.round(weather.feelsLike)}°C</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-background/60 backdrop-blur-sm">
                <Droplets className="h-3.5 w-3.5 text-blue-400" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Humidity</p>
                  <p className="text-xs font-semibold">{weather.humidity}%</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-background/60 backdrop-blur-sm">
                <Wind className="h-3.5 w-3.5 text-teal-400" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Wind</p>
                  <p className="text-xs font-semibold">{Math.round(weather.windSpeed)} km/h {windDir(weather.windDirection)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-background/60 backdrop-blur-sm">
                <Sun className="h-3.5 w-3.5 text-amber-400" />
                <div>
                  <p className="text-[10px] text-muted-foreground">UV Index</p>
                  <p className="text-xs font-semibold">{weather.uvIndex} {weather.uvIndex <= 2 ? "Low" : weather.uvIndex <= 5 ? "Moderate" : "High"}</p>
                </div>
              </div>
            </div>

            {/* Sunrise/Sunset */}
            {todaySunrise && todaySunset && (
              <div className="flex items-center justify-center gap-6 px-4 pb-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Sunrise className="h-3.5 w-3.5 text-amber-400" />
                  <span>{new Date(todaySunrise).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Sunset className="h-3.5 w-3.5 text-orange-400" />
                  <span>{new Date(todaySunset).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>
            )}

            {/* Hourly forecast */}
            <div className="px-4 py-3 border-t border-border/50">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Next 8 Hours</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {next8Hours.map((h, i) => {
                  const hr = new Date(h.time).getHours();
                  return (
                    <div key={i} className="flex flex-col items-center gap-0.5 min-w-[3rem] p-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <span className="text-[10px] text-muted-foreground">{hr}:00</span>
                      {getSmallIcon(h.code)}
                      <span className="text-xs font-semibold">{Math.round(h.temp)}°</span>
                      {h.precip > 0 && (
                        <span className="text-[9px] text-blue-400">{h.precip}%</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 7-day forecast */}
            <div className="px-4 py-3 border-t border-border/50">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">7-Day Forecast</p>
              <div className="space-y-1">
                {weather.daily.map((d, i) => {
                  const dInfo = getWeatherInfo(d.code);
                  const dayName = i === 0 ? "Today" : new Date(d.date).toLocaleDateString([], { weekday: "short" });
                  return (
                    <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/30 transition-colors">
                      <span className="text-xs w-10 text-muted-foreground">{dayName}</span>
                      {getSmallIcon(d.code)}
                      <span className="text-[10px] text-muted-foreground flex-1 hidden sm:block">{dInfo.label}</span>
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
      </CardContent>
    </Card>
  );
}
