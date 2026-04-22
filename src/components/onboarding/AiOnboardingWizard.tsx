import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { LANGUAGES } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Sparkles, Loader2, Lightbulb, ArrowRight, Globe, Circle } from "lucide-react";
import { toast } from "sonner";
import type { IndustryType } from "@/lib/industryConfig";
import { INDUSTRY_CONFIGS } from "@/lib/industryConfig";

interface AiStep {
  key: string;
  title: string;
  description: string;
  ai_tip?: string;
}
interface AiPlan {
  welcome_title: string;
  welcome_message: string;
  steps: AiStep[];
  first_action_cta: string;
  estimated_time_minutes: number;
}

interface Props {
  industry: IndustryType;
  userName?: string;
  companyName?: string;
  onFinished: () => void;
}

export default function AiOnboardingWizard({ industry, userName, companyName, onFinished }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState<string>(i18n.language || "en");
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<AiPlan | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [enabled, setEnabled] = useState(true);
  const [defaultSteps, setDefaultSteps] = useState<any[]>([]);

  // Load industry settings + existing progress
  useEffect(() => {
    (async () => {
      const { data: settings } = await supabase
        .from("onboarding_settings")
        .select("enabled, default_steps")
        .eq("industry", industry)
        .maybeSingle();

      if (!settings || settings.enabled === false) {
        setEnabled(false);
        setLoading(false);
        return;
      }
      setDefaultSteps((settings.default_steps as any[]) || []);

      if (user) {
        const { data: prog } = await supabase
          .from("user_onboarding_progress")
          .select("language, completed_steps, finished")
          .eq("user_id", user.id)
          .maybeSingle();
        if (prog) {
          if (prog.finished) { onFinished(); return; }
          if (prog.language) setLanguage(prog.language);
          setCompleted(new Set(((prog.completed_steps as string[]) || [])));
        }
      }
      await generatePlan(language, (settings.default_steps as any[]) || []);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [industry]);

  const generatePlan = async (lang: string, steps: any[]) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-onboarding-guide", {
        body: {
          industry,
          language: lang,
          steps,
          user_name: userName,
          company_name: companyName,
        },
      });
      if (error) throw error;
      if (!data || !data.steps) throw new Error("Empty AI response");
      setPlan(data as AiPlan);
    } catch (e: any) {
      console.error(e);
      toast.error("Could not load AI onboarding. Showing default plan.");
      setPlan({
        welcome_title: "Welcome to HostFlow AI",
        welcome_message: "Let's get your workspace set up in a few quick steps.",
        steps: steps.map(s => ({ ...s, ai_tip: "" })),
        first_action_cta: "Start",
        estimated_time_minutes: 5,
      });
    } finally {
      setLoading(false);
    }
  };

  const persistProgress = async (next: Set<string>, finished = false) => {
    if (!user) return;
    await supabase.from("user_onboarding_progress").upsert({
      user_id: user.id,
      industry,
      language,
      completed_steps: Array.from(next),
      current_step: next.size,
      finished,
      finished_at: finished ? new Date().toISOString() : null,
    }, { onConflict: "user_id" });
  };

  const toggleStep = (key: string) => {
    const next = new Set(completed);
    next.has(key) ? next.delete(key) : next.add(key);
    setCompleted(next);
    persistProgress(next);
  };

  const handleLanguageChange = async (lang: string) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    await generatePlan(lang, defaultSteps);
  };

  const handleFinish = async () => {
    await persistProgress(completed, true);
    toast.success("🎉 You're all set!");
    onFinished();
    navigate("/dashboard");
  };

  if (!enabled) {
    // Onboarding disabled by admin — skip immediately
    onFinished();
    return null;
  }

  const industryColor = INDUSTRY_CONFIGS[industry]?.color || "hsl(174,62%,50%)";
  const total = plan?.steps.length || 0;
  const done = completed.size;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-[hsl(222,47%,8%)] flex flex-col relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px]" style={{ background: `${industryColor}10` }} />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[hsl(217,91%,60%)]/10 rounded-full blur-[120px]" />
      </div>

      <main className="flex-1 flex items-center justify-center px-4 py-10 relative z-10">
        <div className="w-full max-w-2xl space-y-6">
          {/* Header with language switcher */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/70">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> AI-Personalized Onboarding
            </div>
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-44 h-9 bg-white/5 border-white/10 text-white text-xs">
                <Globe className="w-3.5 h-3.5 mr-1.5 text-white/60" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(l => (
                  <SelectItem key={l.code} value={l.code}>
                    {l.flag} {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <Card className="p-12 bg-white/[0.02] border-white/10 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-white/60 text-sm">Generating your personalized plan…</p>
            </Card>
          ) : plan ? (
            <>
              <div className="text-center space-y-3">
                <h1 className="text-3xl md:text-4xl font-extrabold text-white">{plan.welcome_title}</h1>
                <p className="text-white/60 max-w-lg mx-auto">{plan.welcome_message}</p>
                <p className="text-xs text-white/40">⏱ ~{plan.estimated_time_minutes} min · {done}/{total} done</p>
                <div className="w-full max-w-md mx-auto h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${industryColor}, hsl(217,91%,60%))` }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                {plan.steps.map((s, idx) => {
                  const isDone = completed.has(s.key);
                  return (
                    <Card
                      key={s.key}
                      className={`p-4 border transition-all cursor-pointer ${
                        isDone
                          ? "bg-primary/[0.06] border-primary/30"
                          : "bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.04]"
                      }`}
                      onClick={() => toggleStep(s.key)}
                    >
                      <div className="flex items-start gap-3">
                        {isDone
                          ? <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          : <Circle className="w-5 h-5 text-white/30 shrink-0 mt-0.5" />}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-white/40">{String(idx + 1).padStart(2, "0")}</span>
                            <p className={`font-semibold ${isDone ? "text-white/60 line-through" : "text-white"}`}>{s.title}</p>
                          </div>
                          <p className="text-sm text-white/50 mt-1">{s.description}</p>
                          {s.ai_tip && (
                            <div className="mt-2.5 flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/[0.06] border border-amber-500/20">
                              <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                              <p className="text-xs text-amber-200/90 leading-relaxed">{s.ai_tip}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <Button
                  variant="ghost"
                  onClick={handleFinish}
                  className="text-white/50 hover:text-white hover:bg-white/5"
                >
                  Skip for now
                </Button>
                <Button
                  onClick={handleFinish}
                  size="lg"
                  className="px-8 font-bold text-white rounded-xl shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${industryColor}, hsl(217,91%,60%))` }}
                >
                  {plan.first_action_cta || "Go to Dashboard"} <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}