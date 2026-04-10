import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link2, Unlink, Building2, Sparkles, CheckCircle2 } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { INDUSTRY_CONFIGS, type IndustryType } from "@/lib/industryConfig";
import { toast } from "sonner";

export default function CrmIndustryConnect() {
  const { profile, updateIndustry } = useProfile();
  const [connected, setConnected] = useState(true);
  const [autoManage, setAutoManage] = useState(true);

  const currentIndustry = profile?.industry || "hospitality";
  const config = INDUSTRY_CONFIGS[currentIndustry];

  const handleIndustryChange = async (value: string) => {
    await updateIndustry(value as IndustryType);
    toast.success(`Connected to ${INDUSTRY_CONFIGS[value as IndustryType]?.label || value}`);
  };

  const toggleConnection = () => {
    setConnected(!connected);
    toast.success(connected ? "Disconnected from industry CRM" : "Connected to industry CRM");
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="h-5 w-5 text-primary" />
          Industry CRM Connection
          {connected && (
            <Badge className="bg-green-500/10 text-green-600 border-green-500/20 ml-auto">
              <CheckCircle2 className="h-3 w-3 mr-1" />Connected
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Connect your work to your company's industry so AI can automatically manage your tasks, schedules, and workflows.
        </p>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium w-24">Industry:</span>
          <Select value={currentIndustry} onValueChange={handleIndustryChange}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(INDUSTRY_CONFIGS).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>
                  <span className="flex items-center gap-2">
                    <span>{cfg.icon}</span>
                    <span>{cfg.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" />
            <span className="text-sm">CRM Sync Active</span>
          </div>
          <Switch checked={connected} onCheckedChange={toggleConnection} />
        </div>

        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            <span className="text-sm">AI Auto-Manage Tasks</span>
          </div>
          <Switch checked={autoManage} onCheckedChange={setAutoManage} />
        </div>

        {connected && (
          <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">✅ Your work is connected to: {config?.label}</p>
            <p>• AI will auto-schedule tasks based on {config?.label} workflows</p>
            <p>• Contacts, deals, and tickets sync with industry standards</p>
            <p>• Performance tracked against {config?.label} benchmarks</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
