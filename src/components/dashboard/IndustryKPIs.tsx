import { useState, useEffect } from "react";
import { TrendingUp, Clock, DollarSign, Users, BarChart3, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { IndustryConfig } from "@/lib/industryConfig";

interface IndustryKPIsProps {
  config: IndustryConfig;
}

const iconMap: Record<string, React.ElementType> = {
  percent: BarChart3,
  currency: DollarSign,
  number: Users,
  duration: Clock,
};

const IndustryKPIs = ({ config }: IndustryKPIsProps) => {
  const { user } = useAuth();
  const [kpiValues, setKpiValues] = useState<Record<string, { value: string; trend: number }>>({});

  useEffect(() => {
    if (!user) return;
    const loadKPIs = async () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000).toISOString();

      const [bookingsRes, prevBookingsRes, resourcesRes, contactsRes] = await Promise.all([
        supabase.from("bookings").select("id, total_price, check_in, check_out").gte("created_at", thirtyDaysAgo),
        supabase.from("bookings").select("id, total_price").gte("created_at", sixtyDaysAgo).lt("created_at", thirtyDaysAgo),
        supabase.from("resources").select("id"),
        supabase.from("crm_contacts").select("id"),
      ]);

      const currentBookings = bookingsRes.data || [];
      const prevBookings = prevBookingsRes.data || [];
      const resources = resourcesRes.data || [];
      const contacts = contactsRes.data || [];

      const totalRevenue = currentBookings.reduce((s, b) => s + (Number(b.total_price) || 0), 0);
      const prevRevenue = prevBookings.reduce((s, b) => s + (Number(b.total_price) || 0), 0);
      const revTrend = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : 0;

      const bookingCount = currentBookings.length;
      const prevBookingCount = prevBookings.length;
      const bookingTrend = prevBookingCount > 0 ? Math.round(((bookingCount - prevBookingCount) / prevBookingCount) * 100) : 0;

      const occupancy = resources.length > 0 ? Math.round((bookingCount / (resources.length * 30)) * 100) : 0;

      const avgDuration = currentBookings.length > 0
        ? currentBookings.reduce((s, b) => {
            const ci = new Date(b.check_in).getTime();
            const co = new Date(b.check_out).getTime();
            return s + Math.max(0, (co - ci) / 3600000);
          }, 0) / currentBookings.length
        : 0;

      const vals: Record<string, { value: string; trend: number }> = {};
      config.kpis.forEach(kpi => {
        switch (kpi.format) {
          case "percent":
            vals[kpi.key] = { value: `${Math.min(occupancy, 100)}%`, trend: bookingTrend };
            break;
          case "currency":
            vals[kpi.key] = { value: `$${totalRevenue.toLocaleString()}`, trend: revTrend };
            break;
          case "number":
            vals[kpi.key] = { value: `${bookingCount + contacts.length}`, trend: bookingTrend };
            break;
          case "duration":
            const h = Math.floor(avgDuration);
            const m = Math.round((avgDuration - h) * 60);
            vals[kpi.key] = { value: `${h}h ${m}m`, trend: 0 };
            break;
          default:
            vals[kpi.key] = { value: "—", trend: 0 };
        }
      });
      setKpiValues(vals);
    };
    loadKPIs();
  }, [user, config.kpis]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {config.kpis.map(kpi => {
        const Icon = iconMap[kpi.format] || Activity;
        const data = kpiValues[kpi.key] || { value: "—", trend: 0 };

        return (
          <div key={kpi.key} className="bg-card rounded-xl border border-border shadow-card p-5 hover:shadow-elevated transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground font-medium">{kpi.label}</span>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{data.value}</p>
            <p className={`text-xs mt-1 ${data.trend >= 0 ? "text-success" : "text-destructive"}`}>
              <TrendingUp className={`w-3 h-3 inline mr-1 ${data.trend < 0 ? "rotate-180" : ""}`} />
              {data.trend >= 0 ? "+" : ""}{data.trend}% vs last period
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default IndustryKPIs;
