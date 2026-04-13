import { Shield, AlertTriangle, CheckCircle, Clock, XCircle, Zap, Ban, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { IndustryConfig } from "@/lib/industryConfig";

interface ConflictRow {
  id: string;
  resource_name: string;
  existing_client: string;
  new_client: string;
  existing_time_start: string;
  existing_time_end: string;
  new_time_start: string;
  new_time_end: string;
  conflict_type: string;
  resolution: string;
  resolved_resource_name: string | null;
  suggested_slot_start: string | null;
  suggested_slot_end: string | null;
  email_sent: boolean;
  created_at: string;
}

interface DoubleBookingGuardProps {
  config: IndustryConfig;
}

const typeLabels: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  overlap: { label: "Time Overlap", icon: Ban, color: "text-destructive" },
  turnaround: { label: "Turnaround Violation", icon: Clock, color: "text-warning" },
  buffer: { label: "Buffer Violation", icon: Clock, color: "text-warning" },
  capacity: { label: "Over Capacity", icon: AlertTriangle, color: "text-warning" },
  maintenance: { label: "Maintenance Block", icon: Shield, color: "text-muted-foreground" },
};

const resolutionLabels: Record<string, { label: string; color: string }> = {
  "auto-declined": { label: "Auto-Declined", color: "bg-destructive/10 text-destructive border-destructive/20" },
  "auto-reassigned": { label: "Auto-Reassigned", color: "bg-success/10 text-success border-success/20" },
  pending: { label: "Pending Review", color: "bg-warning/10 text-warning border-warning/20" },
  manual: { label: "Manually Resolved", color: "bg-primary/10 text-primary border-primary/20" },
};

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + ", " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

const DoubleBookingGuard = ({ config }: DoubleBookingGuardProps) => {
  const { user } = useAuth();
  const [conflicts, setConflicts] = useState<ConflictRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchConflicts = async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("booking_conflicts")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false })
        .limit(20);
      setConflicts((data as unknown as ConflictRow[]) || []);
      setLoading(false);
    };
    fetchConflicts();
  }, [user]);

  const stats = {
    total: conflicts.length,
    autoDeclined: conflicts.filter(c => c.resolution === "auto-declined").length,
    autoReassigned: conflicts.filter(c => c.resolution === "auto-reassigned").length,
    pending: conflicts.filter(c => c.resolution === "pending").length,
  };

  const visible = showAll ? conflicts : conflicts.slice(0, 3);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Double-{config.bookingLabel} Prevention
          </CardTitle>
          <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
            <Zap className="w-3 h-3 mr-1" /> AI Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-secondary/50 rounded-lg p-2.5 text-center">
            <p className="text-lg font-bold text-foreground">{stats.total}</p>
            <p className="text-[10px] text-muted-foreground">Conflicts (7d)</p>
          </div>
          <div className="bg-destructive/5 rounded-lg p-2.5 text-center">
            <p className="text-lg font-bold text-destructive">{stats.autoDeclined}</p>
            <p className="text-[10px] text-muted-foreground">Auto-Declined</p>
          </div>
          <div className="bg-success/5 rounded-lg p-2.5 text-center">
            <p className="text-lg font-bold text-success">{stats.autoReassigned}</p>
            <p className="text-[10px] text-muted-foreground">Reassigned</p>
          </div>
          <div className="bg-warning/5 rounded-lg p-2.5 text-center">
            <p className="text-lg font-bold text-warning">{stats.pending}</p>
            <p className="text-[10px] text-muted-foreground">Pending</p>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
          <p className="text-xs font-semibold text-primary mb-1.5">🛡️ Protection Active for {config.label}</p>
          <ul className="text-[11px] text-muted-foreground space-y-1">
            <li className="flex items-start gap-1.5">
              <CheckCircle className="w-3 h-3 text-success mt-0.5 flex-shrink-0" />
              Time overlap detection across all {config.resourceLabelPlural.toLowerCase()}
            </li>
            <li className="flex items-start gap-1.5">
              <CheckCircle className="w-3 h-3 text-success mt-0.5 flex-shrink-0" />
              AI auto-reassignment to available {config.resourceLabelPlural.toLowerCase()}
            </li>
            <li className="flex items-start gap-1.5">
              <CheckCircle className="w-3 h-3 text-success mt-0.5 flex-shrink-0" />
              Auto-reschedule to next available date if no {config.resourceLabel.toLowerCase()} free
            </li>
            <li className="flex items-start gap-1.5">
              <CheckCircle className="w-3 h-3 text-success mt-0.5 flex-shrink-0" />
              Automatic AI email confirmation sent to {config.clientLabel.toLowerCase()}
            </li>
          </ul>
        </div>

        {/* Conflict log */}
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            <span className="text-xs">Loading conflict history...</span>
          </div>
        ) : conflicts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">No conflicts detected in the last 7 days</p>
            <p className="text-[10px] mt-1">AI guard is monitoring all {config.bookingLabelPlural.toLowerCase()}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-foreground">Recent Conflicts</p>
            {visible.map(conflict => {
              const typeInfo = typeLabels[conflict.conflict_type] || typeLabels.overlap;
              const resInfo = resolutionLabels[conflict.resolution] || resolutionLabels["auto-declined"];
              const TypeIcon = typeInfo.icon;

              const suggestion = conflict.resolved_resource_name
                ? `Moved to ${conflict.resolved_resource_name}`
                : conflict.suggested_slot_start
                  ? `Rescheduled to ${formatTime(conflict.suggested_slot_start)}`
                  : null;

              return (
                <div key={conflict.id} className="border border-border rounded-lg p-3 space-y-2 bg-card hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TypeIcon className={`w-3.5 h-3.5 ${typeInfo.color}`} />
                      <span className="text-xs font-medium text-foreground">{typeInfo.label}</span>
                      <span className="text-xs text-muted-foreground">· {conflict.resource_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {conflict.email_sent && (
                        <Badge variant="outline" className="text-[9px] bg-primary/5 text-primary border-primary/20">📧 Sent</Badge>
                      )}
                      <Badge variant="outline" className={`text-[10px] ${resInfo.color}`}>
                        {resInfo.label}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-secondary/50 rounded p-1.5">
                      <p className="text-muted-foreground">Existing</p>
                      <p className="font-medium text-foreground">{conflict.existing_client}</p>
                      <p className="text-muted-foreground">{formatTime(conflict.existing_time_start)} – {formatTime(conflict.existing_time_end)}</p>
                    </div>
                    <div className="bg-destructive/5 rounded p-1.5 border border-destructive/10">
                      <p className="text-muted-foreground">Attempted</p>
                      <p className="font-medium text-foreground">{conflict.new_client}</p>
                      <p className="text-muted-foreground">{formatTime(conflict.new_time_start)} – {formatTime(conflict.new_time_end)}</p>
                    </div>
                  </div>

                  {suggestion && (
                    <div className="flex items-center gap-1.5 text-[11px] text-success">
                      <Zap className="w-3 h-3" />
                      <span>{suggestion}</span>
                    </div>
                  )}

                  <p className="text-[10px] text-muted-foreground">{timeAgo(conflict.created_at)}</p>
                </div>
              );
            })}
          </div>
        )}

        {conflicts.length > 3 && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full text-xs" 
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "Show less" : `View all ${conflicts.length} conflicts`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default DoubleBookingGuard;
