import { Bell, Shield, Calendar, TrendingUp, Globe } from "lucide-react";
import type { Alert } from "@/lib/bookingStore";

const iconMap = {
  "double-booking": Shield,
  "check-in": Calendar,
  pricing: TrendingUp,
  sync: Globe,
};

const colorMap = {
  "double-booking": "text-destructive bg-destructive/10",
  "check-in": "text-primary bg-primary/10",
  pricing: "text-accent bg-accent/10",
  sync: "text-success bg-success/10",
};

interface AlertsPanelProps {
  alerts: Alert[];
  onMarkRead: (id: string) => void;
}

const AlertsPanel = ({ alerts, onMarkRead }: AlertsPanelProps) => (
  <div className="bg-card rounded-xl border border-border shadow-card p-6">
    <div className="flex items-center gap-2 mb-5">
      <Bell className="w-5 h-5 text-foreground" />
      <h2 className="text-lg font-bold text-foreground">Alerts</h2>
      {alerts.filter(a => !a.read).length > 0 && (
        <span className="ml-auto px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold">
          {alerts.filter(a => !a.read).length}
        </span>
      )}
    </div>
    <div className="space-y-3 max-h-80 overflow-y-auto">
      {alerts.map(alert => {
        const Icon = iconMap[alert.type];
        return (
          <button
            key={alert.id}
            onClick={() => onMarkRead(alert.id)}
            className={`w-full text-left flex gap-3 p-3 rounded-lg transition-all hover:bg-secondary/50 ${!alert.read ? "bg-secondary/30" : "opacity-60"}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorMap[alert.type]}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{alert.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{alert.message}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{alert.timestamp.toLocaleString()}</p>
            </div>
            {!alert.read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
          </button>
        );
      })}
    </div>
  </div>
);

export default AlertsPanel;
