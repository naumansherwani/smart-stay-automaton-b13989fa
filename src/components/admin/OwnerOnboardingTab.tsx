import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Rocket, Sparkles, ChevronDown, ChevronRight } from "lucide-react";

type Row = {
  id: string;
  industry: string;
  enabled: boolean;
  ai_tips_enabled: boolean;
  default_steps: any[];
};

const LABELS: Record<string, string> = {
  hospitality: "Travel, Tourism & Hospitality",
  airlines: "Airlines & Aviation",
  car_rental: "Car Rental",
  healthcare: "Healthcare & Clinics",
  education: "Education & Training",
  logistics: "Logistics & Shipping",
  events_entertainment: "Events & Entertainment",
  railways: "Railways & Train Services",
};

export default function OwnerOnboardingTab() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [stats, setStats] = useState<{ started: number; finished: number }>({ started: 0, finished: 0 });

  const load = async () => {
    setLoading(true);
    const [{ data, error }, progress] = await Promise.all([
      supabase.from("onboarding_settings").select("*").order("industry"),
      supabase.from("user_onboarding_progress").select("finished"),
    ]);
    if (error) toast.error("Failed to load");
    setRows((data as Row[]) || []);
    const all = progress.data || [];
    setStats({
      started: all.length,
      finished: all.filter((r: any) => r.finished).length,
    });
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const update = async (id: string, patch: Partial<Row>) => {
    const prev = rows;
    setRows(rows.map(r => r.id === id ? { ...r, ...patch } : r));
    const { error } = await supabase.from("onboarding_settings").update(patch).eq("id", id);
    if (error) {
      setRows(prev);
      toast.error("Update failed: " + error.message);
    } else toast.success("Saved");
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Onboardings Started</p><p className="text-2xl font-bold">{stats.started}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Completed</p><p className="text-2xl font-bold text-primary">{stats.finished}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Rocket className="w-4 h-4 text-primary" />
            AI User Onboarding — Per Industry
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Toggle automated, multilingual AI onboarding for each industry. Wizard runs after a user picks their industry — fully personalized in their language using Lovable AI (Gemini 2.5 Flash). Supports all 14 languages.
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Loading…</p>
          ) : (
            <div className="space-y-2">
              {rows.map(r => (
                <div key={r.id} className="rounded-lg border border-border">
                  <div className="flex items-center justify-between gap-3 p-3">
                    <button
                      onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                      className="flex items-center gap-2 flex-1 min-w-0 text-left"
                    >
                      {expanded === r.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{LABELS[r.industry] || r.industry}</p>
                        <p className="text-[10px] text-muted-foreground">{r.default_steps.length} steps</p>
                      </div>
                    </button>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span className="text-[10px] text-muted-foreground">AI Tips</span>
                        <Switch
                          checked={r.ai_tips_enabled}
                          onCheckedChange={(c) => update(r.id, { ai_tips_enabled: c })}
                        />
                      </div>
                      <Badge variant={r.enabled ? "default" : "secondary"} className="text-[10px] w-14 justify-center">
                        {r.enabled ? "ON" : "OFF"}
                      </Badge>
                      <Switch
                        checked={r.enabled}
                        onCheckedChange={(c) => update(r.id, { enabled: c })}
                      />
                    </div>
                  </div>
                  {expanded === r.id && (
                    <div className="px-3 pb-3 pt-1 border-t border-border bg-muted/30">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 mt-2">Default checklist</p>
                      <ol className="space-y-1.5 text-xs">
                        {r.default_steps.map((s: any, i: number) => (
                          <li key={s.key} className="flex gap-2">
                            <span className="text-muted-foreground font-mono">{i + 1}.</span>
                            <div>
                              <p className="font-medium">{s.title}</p>
                              <p className="text-muted-foreground">{s.description}</p>
                            </div>
                          </li>
                        ))}
                      </ol>
                      <p className="text-[10px] text-muted-foreground mt-3 italic">
                        Step text is automatically translated into the user's language by AI at runtime.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}