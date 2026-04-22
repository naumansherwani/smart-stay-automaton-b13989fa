import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Lock, Shield, Calendar, Sparkles, RefreshCw } from "lucide-react";
import { format } from "date-fns";

const PRIORITY_TIERS = [
  { key: "manual_override", label: "Manual Override (Admin/User Lock)", tier: 1, color: "bg-red-500/10 text-red-600 border-red-500/30" },
  { key: "confirmed_booking", label: "Confirmed Paid Booking", tier: 2, color: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
  { key: "google_calendar", label: "Google Calendar (External Meeting)", tier: 3, color: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
  { key: "ai_confirmed", label: "AI Confirmed Schedule", tier: 4, color: "bg-purple-500/10 text-purple-600 border-purple-500/30" },
  { key: "ai_suggestion", label: "AI Suggestion (Auto-yields)", tier: 5, color: "bg-muted text-muted-foreground border-border" },
];

export default function OwnerConflictPolicyTab() {
  const { user } = useAuth();
  const [policy, setPolicy] = useState<any>(null);
  const [resolutions, setResolutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("scheduling_conflict_policy").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("scheduling_conflict_resolutions").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    setPolicy(p);
    setResolutions(r || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const upsert = async (patch: Record<string, any>) => {
    if (!user) return;
    const next = { ...(policy || { user_id: user.id }), ...patch };
    const { data, error } = await supabase
      .from("scheduling_conflict_policy")
      .upsert(next, { onConflict: "user_id" })
      .select()
      .single();
    if (error) { toast.error("Save failed"); return; }
    setPolicy(data);
    toast.success("Policy updated");
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4 text-primary" />
            Locked Priority Order (Backend-Enforced)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            When two scheduling sources conflict, the higher-tier source <strong>always wins</strong>. This order is enforced server-side and cannot be bypassed.
          </p>
          <div className="space-y-2">
            {PRIORITY_TIERS.map((t) => (
              <div key={t.key} className={`p-3 rounded-lg border flex items-center justify-between ${t.color}`}>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-mono">Tier {t.tier}</Badge>
                  <span className="font-medium text-sm">{t.label}</span>
                </div>
                {t.key === "google_calendar" && <Calendar className="h-4 w-4" />}
                {t.key.startsWith("ai") && <Sparkles className="h-4 w-4" />}
                {t.key === "manual_override" && <Shield className="h-4 w-4" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Behavior Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Google Calendar wins over AI</p>
              <p className="text-xs text-muted-foreground">Real meetings from Gmail invites override AI suggestions</p>
            </div>
            <Switch
              checked={policy?.google_calendar_wins_over_ai ?? true}
              onCheckedChange={(v) => upsert({ google_calendar_wins_over_ai: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Auto-reschedule AI on conflict</p>
              <p className="text-xs text-muted-foreground">AI suggestions automatically yield and reschedule</p>
            </div>
            <Switch
              checked={policy?.auto_reschedule_ai_on_conflict ?? true}
              onCheckedChange={(v) => upsert({ auto_reschedule_ai_on_conflict: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Notify on resolution</p>
              <p className="text-xs text-muted-foreground">Send admin alert when a conflict is resolved</p>
            </div>
            <Switch
              checked={policy?.notify_on_resolution ?? true}
              onCheckedChange={(v) => upsert({ notify_on_resolution: v })}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Buffer minutes</p>
              <p className="text-xs text-muted-foreground">Minimum gap between back-to-back items</p>
            </div>
            <Input
              type="number" min={0} max={120}
              value={policy?.buffer_minutes ?? 15}
              onChange={(e) => upsert({ buffer_minutes: parseInt(e.target.value) || 0 })}
              className="w-24"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Resolutions ({resolutions.length})</CardTitle>
          <Button size="sm" variant="ghost" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[320px]">
            {resolutions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No conflicts resolved yet — the system is clean.</p>
            ) : (
              <div className="space-y-2">
                {resolutions.map((r) => (
                  <div key={r.id} className="p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-xs">Winner: {r.winner}</Badge>
                        <span className="text-xs text-muted-foreground">vs {r.source_a === r.winner ? r.source_b : r.source_a}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{format(new Date(r.created_at), "MMM d, HH:mm")}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{r.reason}</p>
                    <p className="text-xs mt-1"><span className="text-muted-foreground">Action:</span> {r.resolution_action}</p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
