import { Shield, AlertTriangle, CheckCircle, Clock, XCircle, Zap, Ban } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { IndustryConfig } from "@/lib/industryConfig";

interface ConflictEvent {
  id: string;
  resource: string;
  existingClient: string;
  newClient: string;
  existingTime: string;
  newTime: string;
  type: "overlap" | "turnaround" | "capacity" | "maintenance";
  resolution: "auto-declined" | "auto-reassigned" | "pending" | "manual";
  resolvedAt?: string;
  suggestion?: string;
}

interface DoubleBookingGuardProps {
  config: IndustryConfig;
}

const typeLabels: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  overlap: { label: "Time Overlap", icon: Ban, color: "text-destructive" },
  turnaround: { label: "Turnaround Violation", icon: Clock, color: "text-warning" },
  capacity: { label: "Over Capacity", icon: AlertTriangle, color: "text-warning" },
  maintenance: { label: "Maintenance Block", icon: Shield, color: "text-muted-foreground" },
};

const resolutionLabels: Record<string, { label: string; color: string }> = {
  "auto-declined": { label: "Auto-Declined", color: "bg-destructive/10 text-destructive border-destructive/20" },
  "auto-reassigned": { label: "Auto-Reassigned", color: "bg-success/10 text-success border-success/20" },
  pending: { label: "Pending Review", color: "bg-warning/10 text-warning border-warning/20" },
  manual: { label: "Manually Resolved", color: "bg-primary/10 text-primary border-primary/20" },
};

function generateDemoConflicts(config: IndustryConfig): ConflictEvent[] {
  const r = config.resourceLabel;
  const c = config.clientLabel;
  return [
    {
      id: "c1", resource: `${r} 1`, existingClient: `${c} Martinez`, newClient: `${c} Thompson`,
      existingTime: "Apr 8, 2PM – 4PM", newTime: "Apr 8, 3PM – 5PM",
      type: "overlap", resolution: "auto-declined",
      resolvedAt: "2 min ago",
    },
    {
      id: "c2", resource: `${r} 3`, existingClient: `${c} Johnson`, newClient: `${c} Lee`,
      existingTime: "Apr 9, 10AM – 12PM", newTime: "Apr 9, 12PM – 2PM",
      type: "turnaround", resolution: "auto-reassigned",
      resolvedAt: "15 min ago",
      suggestion: `Moved to ${r} 5 (available with buffer)`,
    },
    {
      id: "c3", resource: `${r} 2`, existingClient: `3 ${config.clientLabelPlural}`, newClient: `${c} Park`,
      existingTime: "Apr 10, 9AM – 11AM", newTime: "Apr 10, 9AM – 11AM",
      type: "capacity", resolution: "auto-declined",
      resolvedAt: "1 hr ago",
    },
    {
      id: "c4", resource: `${r} 4`, existingClient: "Maintenance", newClient: `${c} Davis`,
      existingTime: "Apr 11, All Day", newTime: "Apr 11, 2PM – 4PM",
      type: "maintenance", resolution: "auto-reassigned",
      resolvedAt: "3 hrs ago",
      suggestion: `Moved to ${r} 6 (same type, available)`,
    },
    {
      id: "c5", resource: `${r} 1`, existingClient: `${c} Chen`, newClient: `${c} Wilson`,
      existingTime: "Apr 12, 1PM – 3PM", newTime: "Apr 12, 2:30PM – 4PM",
      type: "overlap", resolution: "auto-declined",
      resolvedAt: "5 hrs ago",
    },
  ];
}

const DoubleBookingGuard = ({ config }: DoubleBookingGuardProps) => {
  const conflicts = generateDemoConflicts(config);
  const [showAll, setShowAll] = useState(false);

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
              Turnaround/buffer time enforcement
            </li>
            <li className="flex items-start gap-1.5">
              <CheckCircle className="w-3 h-3 text-success mt-0.5 flex-shrink-0" />
              Capacity limit checks per {config.resourceLabel.toLowerCase()}
            </li>
            <li className="flex items-start gap-1.5">
              <CheckCircle className="w-3 h-3 text-success mt-0.5 flex-shrink-0" />
              Maintenance/blocked period protection
            </li>
            <li className="flex items-start gap-1.5">
              <CheckCircle className="w-3 h-3 text-success mt-0.5 flex-shrink-0" />
              AI auto-reassignment to available {config.resourceLabelPlural.toLowerCase()}
            </li>
          </ul>
        </div>

        {/* Conflict log */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground">Recent Conflicts</p>
          {visible.map(conflict => {
            const typeInfo = typeLabels[conflict.type];
            const resInfo = resolutionLabels[conflict.resolution];
            const TypeIcon = typeInfo.icon;

            return (
              <div key={conflict.id} className="border border-border rounded-lg p-3 space-y-2 bg-card hover:bg-secondary/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TypeIcon className={`w-3.5 h-3.5 ${typeInfo.color}`} />
                    <span className="text-xs font-medium text-foreground">{typeInfo.label}</span>
                    <span className="text-xs text-muted-foreground">· {conflict.resource}</span>
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${resInfo.color}`}>
                    {resInfo.label}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-secondary/50 rounded p-1.5">
                    <p className="text-muted-foreground">Existing</p>
                    <p className="font-medium text-foreground">{conflict.existingClient}</p>
                    <p className="text-muted-foreground">{conflict.existingTime}</p>
                  </div>
                  <div className="bg-destructive/5 rounded p-1.5 border border-destructive/10">
                    <p className="text-muted-foreground">Attempted</p>
                    <p className="font-medium text-foreground">{conflict.newClient}</p>
                    <p className="text-muted-foreground">{conflict.newTime}</p>
                  </div>
                </div>

                {conflict.suggestion && (
                  <div className="flex items-center gap-1.5 text-[11px] text-success">
                    <Zap className="w-3 h-3" />
                    <span>{conflict.suggestion}</span>
                  </div>
                )}

                <p className="text-[10px] text-muted-foreground">{conflict.resolvedAt}</p>
              </div>
            );
          })}
        </div>

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
