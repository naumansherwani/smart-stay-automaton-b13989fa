import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Mic, Zap, Volume2 } from "lucide-react";

type Row = {
  id: string;
  industry: string;
  enabled: boolean;
  latency_mode: "streaming" | "standard";
};

const INDUSTRY_LABELS: Record<string, string> = {
  hospitality: "Travel, Tourism & Hospitality",
  airlines: "Airlines",
  car_rental: "Car Rental",
  healthcare: "Healthcare",
  education: "Education",
  logistics: "Logistics",
  events_entertainment: "Events & Entertainment",
  railways: "Railways",
};

const OwnerVoiceAssistantTab = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("voice_assistant_settings")
      .select("id, industry, enabled, latency_mode")
      .order("industry");
    if (error) toast.error("Failed to load settings");
    setRows((data as Row[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateRow = async (id: string, patch: Partial<Row>) => {
    const prev = rows;
    setRows(rows.map(r => r.id === id ? { ...r, ...patch } : r));
    const { error } = await supabase
      .from("voice_assistant_settings")
      .update(patch)
      .eq("id", id);
    if (error) {
      setRows(prev);
      toast.error("Update failed: " + error.message);
    } else {
      toast.success("Saved");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Mic className="w-4 h-4 text-primary" />
            AI Voice Assistant — Per Industry
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Toggle the voice assistant on/off and pick latency mode for each industry.
            <span className="font-medium text-foreground"> Streaming</span> uses ElevenLabs Turbo v2.5 with low-latency optimization (~300–500ms first audio).
            <span className="font-medium text-foreground"> Standard</span> uses Multilingual v2 (higher fidelity, ~1.5–3s).
            All 15 languages mapped to native ElevenLabs voices: Sarah (EN), Laura (ES/PT/HI/UR), Matilda (IT/FR/RO), Lily (DE/de-CH), Alice (AR/TR), Jessica (ZH/JA/KO).
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Loading…</p>
          ) : (
            <div className="space-y-2">
              {rows.map(r => (
                <div key={r.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {INDUSTRY_LABELS[r.industry] || r.industry}
                    </p>
                    <p className="text-[10px] text-muted-foreground capitalize">{r.industry.replace(/_/g, " ")}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Select
                      value={r.latency_mode}
                      onValueChange={(v) => updateRow(r.id, { latency_mode: v as "streaming" | "standard" })}
                      disabled={!r.enabled}
                    >
                      <SelectTrigger className="w-36 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="streaming">
                          <span className="flex items-center gap-1.5"><Zap className="w-3 h-3" /> Streaming (fast)</span>
                        </SelectItem>
                        <SelectItem value="standard">
                          <span className="flex items-center gap-1.5"><Volume2 className="w-3 h-3" /> Standard (HQ)</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Badge variant={r.enabled ? "default" : "secondary"} className="text-[10px] w-14 justify-center">
                      {r.enabled ? "ON" : "OFF"}
                    </Badge>
                    <Switch
                      checked={r.enabled}
                      onCheckedChange={(checked) => updateRow(r.id, { enabled: checked })}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OwnerVoiceAssistantTab;
