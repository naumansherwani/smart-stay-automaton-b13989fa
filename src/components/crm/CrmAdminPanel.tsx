import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Users, Clock, Activity, Eye, BarChart3, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface UserOverview {
  user_id: string;
  display_name: string;
  industry: string;
  contacts_count: number;
  tickets_count: number;
  open_tickets: number;
  deals_count: number;
  pipeline_value: number;
  work_hours_today: number;
  last_active: string | null;
}

export default function CrmAdminPanel() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserOverview[]>([]);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!data);
      if (data) await fetchOverview();
      setLoading(false);
    };
    checkAdmin();
  }, [user]);

  const fetchOverview = async () => {
    // Fetch all profiles (admin can see all)
    const { data: profiles } = await supabase.from("profiles").select("user_id, display_name, industry");
    if (!profiles) return;

    const overviews: UserOverview[] = [];

    for (const p of profiles.slice(0, 50)) {
      // Get contact count
      const { count: contactsCount } = await supabase.from("crm_contacts").select("*", { count: "exact", head: true }).eq("user_id", p.user_id);
      // Get ticket counts
      const { data: userTickets } = await supabase.from("crm_tickets").select("status").eq("user_id", p.user_id);
      const ticketsCount = userTickets?.length || 0;
      const openTickets = userTickets?.filter(t => t.status === "open" || t.status === "in_progress").length || 0;
      // Get deals
      const { data: userDeals } = await supabase.from("crm_deals").select("value, stage").eq("user_id", p.user_id);
      const dealsCount = userDeals?.length || 0;
      const pipelineValue = userDeals?.filter(d => d.stage !== "Won" && d.stage !== "Lost").reduce((s, d) => s + (d.value || 0), 0) || 0;
      // Work hours today
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const { data: sessions } = await supabase.from("crm_work_sessions").select("duration_seconds, session_type").eq("user_id", p.user_id).gte("started_at", today.toISOString()).eq("session_type", "work");
      const workSeconds = sessions?.reduce((s, sess) => s + (sess.duration_seconds || 0), 0) || 0;

      overviews.push({
        user_id: p.user_id,
        display_name: p.display_name || "Unknown",
        industry: p.industry || "hospitality",
        contacts_count: contactsCount || 0,
        tickets_count: ticketsCount,
        open_tickets: openTickets,
        deals_count: dealsCount,
        pipeline_value: pipelineValue,
        work_hours_today: Math.round(workSeconds / 3600 * 10) / 10,
        last_active: null,
      });
    }

    setUsers(overviews);
  };

  if (loading) return <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;
  if (!isAdmin) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-5 w-5 text-primary" />
          Admin Control Panel
          <Badge className="bg-primary/10 text-primary border-primary/20 ml-2">Admin</Badge>
          <Badge variant="secondary" className="ml-auto">{users.length} users</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Admin Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-2xl font-bold">{users.length}</p>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-2xl font-bold">{users.reduce((s, u) => s + u.contacts_count, 0)}</p>
            <p className="text-xs text-muted-foreground">Total Contacts</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-2xl font-bold">${users.reduce((s, u) => s + u.pipeline_value, 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Pipeline</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-2xl font-bold">{users.reduce((s, u) => s + u.open_tickets, 0)}</p>
            <p className="text-xs text-muted-foreground">Open Tickets</p>
          </div>
        </div>

        {/* Active Alerts for Admin */}
        <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-yellow-700 dark:text-yellow-300">
            <Activity className="h-4 w-4" />
            Admin Insights
          </div>
          <div className="mt-1 text-xs text-muted-foreground space-y-1">
            <p>• {users.filter(u => u.work_hours_today > 0).length} users active today</p>
            <p>• {users.filter(u => u.open_tickets > 3).length} users with high ticket load</p>
            <p>• All user data, CRM features, and security apply to your account too</p>
          </div>
        </div>

        {/* User Table */}
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead className="text-center">Contacts</TableHead>
                  <TableHead className="text-center">Open Tickets</TableHead>
                  <TableHead className="text-center">Deals</TableHead>
                  <TableHead className="text-right">Pipeline</TableHead>
                  <TableHead className="text-center">Work Today</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-medium">{u.display_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{u.industry}</Badge>
                    </TableCell>
                    <TableCell className="text-center">{u.contacts_count}</TableCell>
                    <TableCell className="text-center">
                      {u.open_tickets > 0 ? (
                        <Badge variant="destructive" className="text-xs">{u.open_tickets}</Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">{u.deals_count}</TableCell>
                    <TableCell className="text-right font-mono">${u.pipeline_value.toLocaleString()}</TableCell>
                    <TableCell className="text-center">
                      <span className={u.work_hours_today > 0 ? "text-green-600 font-medium" : "text-muted-foreground"}>
                        {u.work_hours_today}h
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
