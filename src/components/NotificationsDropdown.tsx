import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

const NotificationsDropdown = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchAlerts = async () => {
      const { data } = await supabase
        .from("alerts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) setAlerts(data);
    };
    fetchAlerts();

    const channel = supabase
      .channel("notif-alerts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "alerts", filter: `user_id=eq.${user.id}` }, (payload) => {
        setAlerts(prev => [payload.new as any, ...prev].slice(0, 20));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const unread = alerts.filter(a => !a.read).length;

  const markRead = async (id: string) => {
    await supabase.from("alerts").update({ read: true }).eq("id", id);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  };

  const markAllRead = async () => {
    const unreadIds = alerts.filter(a => !a.read).map(a => a.id);
    if (unreadIds.length === 0) return;
    for (const id of unreadIds) {
      await supabase.from("alerts").update({ read: true }).eq("id", id);
    }
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-4 h-4" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center animate-pulse">
              {unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <span className="text-sm font-semibold text-foreground">{t("notifications.title")}</span>
          {unread > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={markAllRead}>
              <Check className="w-3 h-3 mr-1" /> {t("notifications.markRead")}
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-72">
          {alerts.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {t("notifications.empty")}
            </div>
          ) : (
            alerts.map((alert) => (
              <DropdownMenuItem
                key={alert.id}
                className={`flex flex-col items-start gap-1 px-3 py-2.5 cursor-pointer ${!alert.read ? "bg-primary/5" : ""}`}
                onClick={() => markRead(alert.id)}
              >
                <div className="flex items-center gap-2 w-full">
                  {!alert.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                  <span className="text-sm font-medium text-foreground truncate">{alert.title}</span>
                </div>
                <span className="text-xs text-muted-foreground line-clamp-2">{alert.message}</span>
                <span className="text-[10px] text-muted-foreground/60">
                  {new Date(alert.created_at).toLocaleDateString()}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationsDropdown;
