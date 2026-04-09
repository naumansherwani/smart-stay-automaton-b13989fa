import { Card, CardContent } from "@/components/ui/card";
import { TrainFront, Route, Ticket, TrendingUp, Users, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const RailwayStatsCards = () => {
  const { data: trains } = useQuery({
    queryKey: ["railway-trains-count"],
    queryFn: async () => {
      const { count } = await supabase.from("railway_trains").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: routes } = useQuery({
    queryKey: ["railway-routes-count"],
    queryFn: async () => {
      const { count } = await supabase.from("railway_routes").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: bookings } = useQuery({
    queryKey: ["railway-bookings-count"],
    queryFn: async () => {
      const { count } = await supabase.from("railway_bookings").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: schedules } = useQuery({
    queryKey: ["railway-schedules-today"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { count } = await supabase.from("railway_schedules").select("*", { count: "exact", head: true }).eq("schedule_date", today);
      return count || 0;
    },
  });

  const stats = [
    { label: "Active Trains", value: trains ?? 0, icon: TrainFront, color: "hsl(200,70%,50%)", bg: "hsl(200,70%,50%,0.1)" },
    { label: "Routes", value: routes ?? 0, icon: Route, color: "hsl(160,60%,45%)", bg: "hsl(160,60%,45%,0.1)" },
    { label: "Today's Runs", value: schedules ?? 0, icon: TrendingUp, color: "hsl(38,92%,55%)", bg: "hsl(38,92%,55%,0.1)" },
    { label: "Total Bookings", value: bookings ?? 0, icon: Ticket, color: "hsl(270,80%,65%)", bg: "hsl(270,80%,65%,0.1)" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map(s => (
        <Card key={s.label} className="border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: s.bg }}>
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default RailwayStatsCards;
