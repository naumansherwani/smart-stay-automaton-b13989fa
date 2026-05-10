import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Check, ShieldAlert, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { replitCall } from "@/lib/replitApi";

interface HubIssue {
  id: number;
  status: string;
  issue_summary?: string;
  advisor_name?: string;
  industry?: string;
  created_at: string;
}

const NotificationsDropdown = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [hubIssues, setHubIssues] = useState<HubIssue[]>([]);

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

  // Poll active Resolution Hub issues every 15s for the bell dropdown.
  useEffect(() => {
    if (!user) return;
    let alive = true;
    const load = async () => {
      const res = await replitCall<{ issues: HubIssue[] }>(
        "/resolution-hub/issues/active",
        undefined,
        { method: "GET" },
      );
      if (!alive) return;
      setHubIssues(Array.isArray(res.data?.issues) ? res.data!.issues : []);
    };
    load();
    const id = setInterval(load, 15000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [user]);

  const unread = alerts.filter(a => !a.read).length;
  const sherlockCount = hubIssues.filter(i => i.status === "sherlock_active").length;
  const activeCount = hubIssues.filter(i => i.status === "active").length;
  const bellCount = unread + sherlockCount;

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
          {bellCount > 0 && (
            <span
              className={`absolute -top-1 -right-1 min-w-[16px] h-4 px-1 text-[10px] rounded-full flex items-center justify-center animate-pulse text-white ${
                sherlockCount > 0 ? "bg-red-500" : "bg-destructive text-destructive-foreground"
              }`}
            >
              {bellCount}
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
          {/* Resolution Hub live issues — shown above generic alerts */}
          {hubIssues.length > 0 && (
            <div className="border-b border-border/60">
              {hubIssues.slice(0, 5).map((issue) => {
                const isSherlock = issue.status === "sherlock_active";
                return (
                  <DropdownMenuItem
                    key={`hub-${issue.id}`}
                    onClick={() => navigate("/resolution-hub")}
                    className={`flex flex-col items-start gap-1 px-3 py-2.5 cursor-pointer border-l-2 ${
                      isSherlock
                        ? "border-l-red-500 bg-red-500/5"
                        : "border-l-cyan-500 bg-cyan-500/5"
                    }`}
                  >
                    <div className="flex items-center gap-2 w-full">
                      {isSherlock ? (
                        <ShieldAlert className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                      )}
                      <span className="text-sm font-medium text-foreground truncate flex-1">
                        {isSherlock ? "Sherlock Active" : "Active issue"} · #{issue.id}
                      </span>
                      <span
                        className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          isSherlock
                            ? "bg-red-500/20 text-red-500"
                            : "bg-cyan-500/20 text-cyan-500"
                        }`}
                      >
                        {isSherlock ? "Sherlock" : "Active"}
                      </span>
                    </div>
                    {issue.issue_summary && (
                      <span className="text-xs text-muted-foreground line-clamp-2 pl-5">
                        {issue.issue_summary}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground/60 pl-5">
                      {issue.advisor_name}
                      {issue.industry ? ` · ${issue.industry.replace(/_/g, " ")}` : ""}
                    </span>
                  </DropdownMenuItem>
                );
              })}
            </div>
          )}

          {alerts.length === 0 && hubIssues.length === 0 ? (
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
