import { useCrmSecurity } from "@/hooks/useCrmSecurity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, ShieldAlert, Activity, CheckCircle2, AlertTriangle, Info } from "lucide-react";

const severityColor: Record<string, string> = {
  low: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  medium: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  high: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  critical: "bg-destructive/10 text-destructive border-destructive/20",
};

const actionIcons: Record<string, string> = {
  create: "🟢",
  update: "🔵",
  delete: "🔴",
  export: "📤",
  email_sent: "📧",
  login: "🔑",
};

export default function CrmSecurityPanel() {
  const { alerts, logs, loading, resolveAlert, unresolvedCount } = useCrmSecurity();

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Security Transparency Notice */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-3 flex items-center gap-3">
          <Shield className="h-5 w-5 text-primary shrink-0" />
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Security Notice:</strong> Your activity may be monitored for security purposes. Only important business actions (create, update, delete, exports) are tracked. No screen recording or hidden tracking is used.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="alerts">
        <TabsList>
          <TabsTrigger value="alerts" className="flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4" />
            Alerts
            {unresolvedCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                {unresolvedCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-1.5">
            <Activity className="h-4 w-4" />
            Activity Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" /> Security Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-96">
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    <Shield className="h-10 w-10 mx-auto mb-2 text-green-500" />
                    <p>No security alerts — everything looks safe!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alerts.map(alert => (
                      <div key={alert.id} className={`p-3 rounded-lg border ${alert.is_resolved ? 'opacity-50' : ''} ${severityColor[alert.severity] || ''}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            {alert.severity === 'critical' ? <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" /> : <Info className="h-4 w-4 mt-0.5 shrink-0" />}
                            <div>
                              <p className="text-sm font-medium">{alert.title}</p>
                              <p className="text-xs mt-1">{alert.message}</p>
                              <p className="text-[10px] mt-1 opacity-60">
                                {new Date(alert.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          {!alert.is_resolved && (
                            <Button size="sm" variant="ghost" className="h-7 text-xs shrink-0" onClick={() => resolveAlert(alert.id)}>
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Resolve
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" /> Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-96">
                {logs.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No activity recorded yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {logs.map(log => (
                      <div key={log.id} className="flex items-center gap-3 p-2 rounded border border-border/50 text-sm">
                        <span className="text-base">{actionIcons[log.action_type] || "⚪"}</span>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium capitalize">{log.action_type}</span>
                          <span className="text-muted-foreground"> — {log.entity_type}</span>
                          {log.description && <p className="text-xs text-muted-foreground truncate">{log.description}</p>}
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {new Date(log.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
