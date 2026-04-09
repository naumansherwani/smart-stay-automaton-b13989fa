import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, AlertTriangle, Info, Clock, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  booking_confirmed: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10" },
  delay: { icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  cancellation: { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
  reminder: { icon: Bell, color: "text-blue-500", bg: "bg-blue-500/10" },
  info: { icon: Info, color: "text-primary", bg: "bg-primary/10" },
};

const RailwayNotificationsTab = () => {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["railway-notifications"],
    queryFn: async () => {
      const { data } = await supabase.from("railway_notifications")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("railway_notifications").update({ is_read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["railway-notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const ids = notifications.filter((n: any) => !n.is_read).map((n: any) => n.id);
      if (ids.length === 0) return;
      for (const id of ids) {
        await supabase.from("railway_notifications").update({ is_read: true }).eq("id", id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["railway-notifications"] });
      toast.success("All marked as read");
    },
  });

  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold">Notifications</h2>
          {unreadCount > 0 && (
            <Badge className="bg-primary text-primary-foreground">{unreadCount} unread</Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()}>Mark All Read</Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Card key={i} className="animate-pulse h-16 bg-muted/50" />)}</div>
      ) : notifications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="font-semibold text-lg mb-1">No notifications</h3>
            <p className="text-sm text-muted-foreground">You'll see booking confirmations, delays, and reminders here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif: any) => {
            const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info;
            const Icon = config.icon;
            return (
              <Card
                key={notif.id}
                className={`transition-all cursor-pointer hover:shadow-md ${!notif.is_read ? "border-l-4 border-l-primary bg-primary/[0.02]" : "border-border/50 opacity-70"}`}
                onClick={() => !notif.is_read && markRead.mutate(notif.id)}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${config.bg}`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`text-sm font-semibold ${!notif.is_read ? "text-foreground" : "text-muted-foreground"}`}>{notif.title}</h4>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {format(new Date(notif.created_at), "MMM dd, HH:mm")}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RailwayNotificationsTab;
