import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchLatestIntelligenceReport,
  fetchIntelligenceReportById,
  generateIntelligenceReport,
  emailIntelligenceReport,
  ApiError,
  type IntelligenceReport,
} from "@/lib/api";
import { ADVISOR_ORDER, type Report } from "./revenue-intel/types";
import Gauge from "./revenue-intel/Gauge";
import LiveFeed from "./revenue-intel/LiveFeed";
import {
  Activity, AlertTriangle, ArrowRight, CheckCircle2, Download, FileText, Loader2,
  Mail, RadioTower, RefreshCcw, Sparkles, Target, TrendingUp, XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/* ───────── helpers ───────── */

const fmtDate = (iso?: string) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
      hour: "numeric", minute: "2-digit",
    });
  } catch { return iso; }
};

const safe = (v: unknown): string => {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
};

/* ───────── small UI atoms ───────── */

function SectionShell({
  number, title, subtitle, children, anchor,
}: { number: number; title: string; subtitle?: string; children: React.ReactNode; anchor?: string }) {
  return (
    <section id={anchor} className="founder-card p-6 md:p-8">
      <div className="flex items-baseline gap-3 mb-5">
        <span className="text-[10px] font-mono tabular-nums text-cyan-400/70">S{String(number).padStart(2, "0")}</span>
        <h2 className="text-[var(--fos-text)] text-lg md:text-xl font-semibold">{title}</h2>
        {subtitle && <span className="text-[var(--fos-muted)] text-xs">· {subtitle}</span>}
      </div>
      {children}
    </section>
  );
}

function MetricTile({
  label, value, highlight, hint,
}: { label: string; value: string; highlight?: boolean; hint?: string }) {
  return (
    <div
      className={`founder-kpi p-4 rounded-lg ${
        highlight ? "ring-1 ring-cyan-400/40 bg-cyan-400/[0.03]" : ""
      }`}
    >
      <div className="text-[10px] uppercase tracking-wider text-[var(--fos-muted)]">{label}</div>
      <div className={`mt-1.5 tabular-nums font-bold text-[var(--fos-text)] ${highlight ? "text-2xl md:text-3xl" : "text-xl"}`}>
        {value}
      </div>
      {hint && <div className="text-[10px] text-[var(--fos-muted)] mt-1">{hint}</div>}
    </div>
  );
}

function StatusPill({ status }: { status?: Report["status"] }) {
  if (status === "ready") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        Sherlock: Active
      </span>
    );
  }
  if (status === "generating") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-amber-400">
        <Loader2 className="w-3 h-3 animate-spin" />
        Sherlock: Generating
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-red-400">
        <XCircle className="w-3 h-3" />
        Sherlock: Check Required
      </span>
    );
  }
  return <span className="text-[11px] text-[var(--fos-muted)]">Sherlock: Idle</span>;
}

/* ───────── PDF (client-side, lazy) ───────── */
async function exportPdf(report: Report) {
  const [{ default: jsPDF }] = await Promise.all([import("jspdf")]);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  let y = margin;
  const line = (txt: string, size = 11, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(txt, 515);
    for (const ln of lines) {
      if (y > 800) { doc.addPage(); y = margin; }
      doc.text(ln, margin, y);
      y += size + 4;
    }
  };
  line("HostFlow AI · Revenue Intelligence", 18, true); y += 4;
  line(`${report.periodLabel} · Generated ${fmtDate(report.createdAt)}`, 10);
  line(`Confidence ${report.confidenceScore}% · Status ${report.status}`, 10);
  y += 8;

  const section = (n: number, t: string, body: string) => {
    line(`S${n}. ${t}`, 13, true);
    line(body || "—", 10);
    y += 6;
  };

  section(1, "Executive Summary", report.s1_executive_summary);
  section(2, "Revenue Impact", JSON.stringify(report.s2_revenue_impact, null, 2));
  section(3, "Cost Savings", JSON.stringify(report.s3_cost_savings, null, 2));
  section(4, "AI Resolution Metrics", JSON.stringify(report.s4_ai_resolution_metrics, null, 2));
  section(5, "Recovery Engine", JSON.stringify(report.s5_recovery_engine, null, 2));
  section(6, "Industry Advisor Insights", JSON.stringify(report.s6_industry_advisor_insights, null, 2));
  section(7, "Sherlock Strategic Notes", report.s7_sherlock_strategic_notes);
  section(8, "Growth Recommendations", JSON.stringify(report.s8_growth_recommendations, null, 2));
  section(9, "Forecast Next Month", JSON.stringify(report.s9_forecast_next_month, null, 2));
  section(10, "Net Business Impact", JSON.stringify(report.s10_net_business_impact, null, 2));

  doc.save(`hostflow-intelligence-${report.id}.pdf`);
}

/* ───────── main component ───────── */

export default function RevenueIntelligence() {
  const { toast } = useToast();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [missing, setMissing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [liveOn, setLiveOn] = useState(false);
  const pollRef = useRef<number | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { window.clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const loadLatest = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetchLatestIntelligenceReport();
      setReport(r);
      setMissing(false);
      if (r.status === "generating") {
        setGenerating(true);
        startPoll(r.id);
      } else {
        setGenerating(false);
      }
    } catch (e) {
      const err = e as ApiError;
      if (err.status === 403) { setForbidden(true); }
      else if (err.status === 404 || err.code === "NOT_FOUND") { setMissing(true); setReport(null); }
      else {
        toast({ title: "Failed to load report", description: err.message, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startPoll = useCallback((id: string) => {
    stopPolling();
    pollRef.current = window.setInterval(async () => {
      try {
        const r = await fetchIntelligenceReportById(id);
        setReport(r);
        if (r.status === "ready" || r.status === "failed") {
          stopPolling();
          setGenerating(false);
          if (r.status === "ready") toast({ title: "Intelligence report ready" });
          if (r.status === "failed") toast({ title: "Report failed", variant: "destructive" });
        }
      } catch { /* keep polling */ }
    }, 5000);
  }, [stopPolling, toast]);

  useEffect(() => { loadLatest(); return () => stopPolling(); }, [loadLatest, stopPolling]);

  const onGenerate = async () => {
    setGenerating(true);
    try {
      const r = await generateIntelligenceReport();
      setMissing(false);
      setReport((prev) => prev ?? ({
        id: r.id, status: "generating", periodLabel: r.period || "", periodType: "",
        confidenceScore: 0, createdAt: new Date().toISOString(),
        s1_executive_summary: "", s2_revenue_impact: {}, s3_cost_savings: {},
        s4_ai_resolution_metrics: {}, s5_recovery_engine: {}, s6_industry_advisor_insights: [],
        s7_sherlock_strategic_notes: "", s8_growth_recommendations: {}, s9_forecast_next_month: {},
        s10_net_business_impact: {},
      } as Report));
      startPoll(r.id);
    } catch (e) {
      setGenerating(false);
      toast({ title: "Could not start generation", description: (e as ApiError).message, variant: "destructive" });
    }
  };

  const onEmail = async () => {
    if (!report) return;
    try {
      await emailIntelligenceReport(report.id);
      toast({ title: "Report emailed", description: "Sent to revenuereport@hostflowai.net" });
    } catch (e) {
      toast({ title: "Email failed", description: (e as ApiError).message, variant: "destructive" });
    }
  };

  const scrollForecast = () => {
    document.getElementById("ri-section-9")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* ───────── derived ───────── */
  const s10 = report?.s10_net_business_impact || {};
  const s2 = report?.s2_revenue_impact || {};
  const s5 = report?.s5_recovery_engine || {};
  const s6 = report?.s6_industry_advisor_insights || [];
  const activeAdvisors = useMemo(
    () => s6.filter((x) => Number(x?.interactions || 0) > 0).length,
    [s6]
  );

  /* ───────── render ───────── */

  if (forbidden) {
    return (
      <div className="founder-card p-12 text-center">
        <ShieldHidden />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top control bar */}
      <div className="founder-card p-4 flex flex-wrap items-center gap-3 justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onGenerate}
            disabled={generating}
            className="founder-cmd-btn flex items-center gap-2 disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {generating ? "Generating…" : "Generate Report"}
          </button>
          <button
            onClick={() => setLiveOn((v) => !v)}
            className={`founder-cmd-btn flex items-center gap-2 ${liveOn ? "!border-cyan-400 !text-cyan-400" : ""}`}
          >
            <RadioTower className="w-3.5 h-3.5" />
            {liveOn ? "Live · ON" : "Live Intelligence"}
          </button>
          <button onClick={scrollForecast} className="founder-cmd-btn flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5" /> Forecast
          </button>
          <button
            onClick={() => report && exportPdf(report)}
            disabled={!report || report.status !== "ready"}
            className="founder-cmd-btn flex items-center gap-2 disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" /> Export PDF
          </button>
          <button
            onClick={onEmail}
            disabled={!report || report.status !== "ready"}
            className="founder-cmd-btn flex items-center gap-2 disabled:opacity-40"
          >
            <Mail className="w-3.5 h-3.5" /> Email
          </button>
          <button onClick={loadLatest} className="founder-cmd-btn flex items-center gap-2">
            <RefreshCcw className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-5 text-[11px]">
          <div>
            <div className="text-[var(--fos-muted)] uppercase tracking-wider text-[9px]">Last Sync</div>
            <div className="text-[var(--fos-text)] font-mono">{fmtDate(report?.createdAt)}</div>
          </div>
          <div>
            <div className="text-[var(--fos-muted)] uppercase tracking-wider text-[9px]">AI Confidence</div>
            <div className="text-cyan-400 font-bold tabular-nums">{report?.confidenceScore ?? 0}%</div>
          </div>
          <StatusPill status={report?.status} />
        </div>
      </div>

      {/* Empty / loading states */}
      {loading && !report && (
        <div className="founder-card p-12 text-center text-[var(--fos-muted)]">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
          Loading intelligence…
        </div>
      )}

      {missing && !report && (
        <div className="founder-card p-12 text-center">
          <FileText className="w-8 h-8 mx-auto text-[var(--fos-muted)] mb-3" />
          <h3 className="text-[var(--fos-text)] text-lg font-semibold mb-1">No report generated yet</h3>
          <p className="text-[var(--fos-muted)] text-sm mb-5">
            Powered by revenuereport@hostflowai.net
          </p>
          <button onClick={onGenerate} disabled={generating} className="founder-cmd-btn inline-flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" />
            {generating ? "Generating…" : "Generate First Report"}
          </button>
        </div>
      )}

      {report && report.status === "generating" && (
        <div className="founder-card p-10 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-cyan-400" />
          <div className="text-[var(--fos-text)] font-semibold">Sherlock is composing your report</div>
          <div className="text-[var(--fos-muted)] text-sm mt-1">This typically takes a minute. Polling every 5s.</div>
        </div>
      )}

      {/* Main grid: report + live feed */}
      {report && report.status !== "generating" && (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
          <div className="space-y-6">
            {/* HERO */}
            <div className="founder-card p-6 md:p-8 relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none opacity-[0.06] bg-[radial-gradient(circle_at_30%_20%,#22D3EE,transparent_60%)]" />
              <div className="relative grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-center">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-400/80 font-semibold">
                    HostFlow Value Generated
                  </div>
                  <div className="text-4xl md:text-6xl font-bold tabular-nums text-[var(--fos-text)] mt-2">
                    {safe(s10.totalCostSavings)}
                  </div>
                  <p className="text-[var(--fos-muted)] text-sm md:text-base mt-3 max-w-2xl leading-relaxed">
                    {safe(s10.verdictOneLiner)}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-5">
                    <MetricTile label="Revenue Increase" value={safe(s2.revenueGrowthEstimate)} />
                    <MetricTile label="Recovery Engine" value={safe(s5.operationalContinuity)} />
                    <MetricTile label="Active AI Advisors" value={`${activeAdvisors}/8`} />
                  </div>
                </div>
                <div className="md:pl-6 md:border-l md:border-[var(--fos-border)]">
                  <Gauge value={Number(s10.hostflowValueScore) || 0} size={140} label="HostFlow Score" />
                </div>
              </div>
            </div>

            {/* S1 */}
            <SectionShell number={1} title="Executive Summary" subtitle="Sherlock Strategic Intelligence">
              <p className="text-[var(--fos-text)] leading-relaxed whitespace-pre-line text-[14px]">
                {safe(report.s1_executive_summary)}
              </p>
            </SectionShell>

            {/* S2 */}
            <SectionShell number={2} title="Revenue Impact">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MetricTile label="Revenue Growth" value={safe(s2.revenueGrowthEstimate)} />
                <MetricTile label="Conversion" value={safe(s2.conversionImprovements)} />
                <MetricTile label="Booking Increase" value={safe(s2.bookingIncreases)} />
                <MetricTile label="Occupancy" value={safe(s2.occupancyImprovements)} />
                <MetricTile label="Repeat Customers" value={safe(s2.repeatCustomerGrowth)} />
                <MetricTile label="AI Upsells" value={safe(s2.aiAssistedUpsells)} />
                <MetricTile label="Recovered Orders" value={safe(s2.abandonedRecoveries)} />
                <MetricTile label="Total Impact" value={safe(s2.totalRevenueImpact)} highlight />
              </div>
              {s2.confidenceNote && (
                <p className="text-[var(--fos-muted)] italic text-xs mt-4">{s2.confidenceNote}</p>
              )}
            </SectionShell>

            {/* S3 */}
            <SectionShell number={3} title="Cost Savings" subtitle="HostFlow vs Traditional">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <MetricTile label="vs OTA / Marketplace" value={safe(report.s3_cost_savings.vsMarketplaceFees)} />
                <MetricTile label="vs Manual Support" value={safe(report.s3_cost_savings.vsManualSupport)} />
                <MetricTile label="vs External AI CRM" value={safe(report.s3_cost_savings.vsExternalAICRM)} />
                <MetricTile label="Automation Impact" value={safe(report.s3_cost_savings.automationImpact)} />
                <MetricTile label="Efficiency Gain" value={safe(report.s3_cost_savings.operationalEfficiency)} />
                <MetricTile label="Total Savings" value={safe(report.s3_cost_savings.totalSavingsEstimate)} highlight />
              </div>
              <div className="mt-5">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[var(--fos-muted)] mb-1.5">
                  <span>Savings Confidence</span>
                  <span className="text-cyan-400 tabular-nums">{report.s3_cost_savings.savingsConfidence ?? 0}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--fos-border)] overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 transition-[width] duration-500"
                    style={{ width: `${Math.max(0, Math.min(100, Number(report.s3_cost_savings.savingsConfidence) || 0))}%` }}
                  />
                </div>
              </div>
            </SectionShell>

            {/* S4 */}
            <SectionShell number={4} title="AI Resolution Metrics">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <MetricTile label="AI Calls This Period" value={safe(report.s4_ai_resolution_metrics.totalAiCallsThisPeriod)} />
                <MetricTile label="Avg Resolution Time" value={safe(report.s4_ai_resolution_metrics.avgResolutionTime)} />
                <MetricTile label="First Resolution Rate" value={safe(report.s4_ai_resolution_metrics.aiFirstResolutionRate)} />
                <MetricTile label="Escalation Rate" value={safe(report.s4_ai_resolution_metrics.sherlockEscalationRate)} />
                <MetricTile label="Automation %" value={safe(report.s4_ai_resolution_metrics.automationPercentage)} />
                <MetricTile label="Engagement Trend" value={safe(report.s4_ai_resolution_metrics.engagementTrend)} />
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4">
                <MetricTile label="Chat" value={safe(report.s4_ai_resolution_metrics.channelBreakdown?.chat)} />
                <MetricTile label="Email" value={safe(report.s4_ai_resolution_metrics.channelBreakdown?.email)} />
                <MetricTile label="WhatsApp" value={safe(report.s4_ai_resolution_metrics.channelBreakdown?.whatsapp)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[var(--fos-muted)] mb-2">Top Endpoints</div>
                  <div className="space-y-1.5">
                    {(report.s4_ai_resolution_metrics.topEndpoints || []).map((e, i) => (
                      <div key={i} className="flex items-center justify-between text-xs py-1.5 px-2 rounded bg-[var(--fos-bg)]/50">
                        <span className="font-mono text-[var(--fos-text)] truncate">{e.endpoint}</span>
                        <span className="text-cyan-400 tabular-nums">{e.count}</span>
                      </div>
                    ))}
                    {(!report.s4_ai_resolution_metrics.topEndpoints?.length) && (
                      <div className="text-[var(--fos-muted)] text-xs italic">No endpoint data</div>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[var(--fos-muted)] mb-2">Advisor Effectiveness</div>
                  <div className="space-y-1.5">
                    {(report.s4_ai_resolution_metrics.advisorEffectiveness || []).map((a, i) => (
                      <div key={i} className="flex items-center justify-between text-xs py-1.5 px-2 rounded bg-[var(--fos-bg)]/50">
                        <span className="text-[var(--fos-text)]">
                          <span className="font-semibold">{a.advisor}</span>
                          <span className="text-[var(--fos-muted)]"> · {a.industry}</span>
                        </span>
                        <span className="text-cyan-400 tabular-nums">{a.interactions}</span>
                      </div>
                    ))}
                    {(!report.s4_ai_resolution_metrics.advisorEffectiveness?.length) && (
                      <div className="text-[var(--fos-muted)] text-xs italic">No advisor data</div>
                    )}
                  </div>
                </div>
              </div>
            </SectionShell>

            {/* S5 */}
            <SectionShell number={5} title="Recovery Engine">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <MetricTile label="Payment Recoveries" value={safe(s5.paymentRecoveries)} />
                <MetricTile label="Retention Saves" value={safe(s5.customerRetentionSaves)} />
                <MetricTile label="AI Interventions" value={safe(s5.aiInterventionCount)} />
                <MetricTile label="Recovered Revenue" value={safe(s5.recoveredRevenueEstimate)} highlight />
                <MetricTile label="Prevented Churn Value" value={safe(s5.preventedChurnValue)} />
                <MetricTile label="Operational Continuity" value={safe(s5.operationalContinuity)} />
              </div>
            </SectionShell>

            {/* S6 */}
            <SectionShell number={6} title="Industry Intelligence" subtitle="8 Advisor Cells">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                {ADVISOR_ORDER.map((slot) => {
                  const found = s6.find((x) => x.advisor === slot.advisor || x.industry === slot.industry);
                  const inactive = !found || Number(found.interactions || 0) === 0;
                  return (
                    <div
                      key={slot.advisor}
                      className={`p-4 rounded-lg border ${
                        inactive
                          ? "border-[var(--fos-border)] bg-[var(--fos-bg)]/40 opacity-60"
                          : "border-[var(--fos-border)] bg-[var(--fos-card)]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-[var(--fos-text)] text-base font-bold">{slot.advisor}</div>
                        <span className="text-[9px] uppercase tracking-wider text-[var(--fos-muted)]">{slot.label}</span>
                      </div>
                      <div className="flex gap-3 text-[10px] text-[var(--fos-muted)] mb-2">
                        <span>{found?.interactions ?? 0} int.</span>
                        <span>{found?.memoriesExtracted ?? 0} mem.</span>
                      </div>
                      <p className="text-[var(--fos-text)] text-xs leading-relaxed line-clamp-4">
                        {found?.topInsight || "No memory data yet"}
                      </p>
                      {found?.performanceNote && (
                        <p className="text-[10px] text-[var(--fos-muted)] italic mt-2 line-clamp-2">{found.performanceNote}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </SectionShell>

            {/* S7 */}
            <SectionShell number={7} title="Sherlock Strategic Notes">
              <div className="space-y-4 text-[var(--fos-text)] text-[14px] leading-relaxed">
                {(report.s7_sherlock_strategic_notes || "—")
                  .split(/\n{2,}/)
                  .map((p, i) => <p key={i}>{p}</p>)}
              </div>
            </SectionShell>

            {/* S8 */}
            <SectionShell number={8} title="Growth Recommendations">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <RecCard
                  icon={<TrendingUp className="w-4 h-4" />}
                  badge="Strategic"
                  badgeTone="cyan"
                  title={report.s8_growth_recommendations.strategicGrowthRec?.title}
                  detail={report.s8_growth_recommendations.strategicGrowthRec?.detail}
                  meta={`Impact: ${report.s8_growth_recommendations.strategicGrowthRec?.estimatedImpact || "—"}`}
                />
                <RecCard
                  icon={<AlertTriangle className="w-4 h-4" />}
                  badge={
                    report.s8_growth_recommendations.operationalWarning?.urgency === "immediate" ? "Immediate" :
                    report.s8_growth_recommendations.operationalWarning?.urgency === "this_week" ? "This Week" : "This Month"
                  }
                  badgeTone={
                    report.s8_growth_recommendations.operationalWarning?.urgency === "immediate" ? "red" :
                    report.s8_growth_recommendations.operationalWarning?.urgency === "this_week" ? "amber" : "blue"
                  }
                  title={report.s8_growth_recommendations.operationalWarning?.title}
                  detail={report.s8_growth_recommendations.operationalWarning?.detail}
                />
                <RecCard
                  icon={<Target className="w-4 h-4" />}
                  badge="Missed"
                  badgeTone="amber"
                  title={report.s8_growth_recommendations.missedOpportunity?.title}
                  detail={report.s8_growth_recommendations.missedOpportunity?.detail}
                  meta={`Potential: ${report.s8_growth_recommendations.missedOpportunity?.potentialValue || "—"}`}
                />
                <RecCard
                  icon={<Activity className="w-4 h-4" />}
                  badge="Optimization"
                  badgeTone="cyan"
                  title={report.s8_growth_recommendations.revenueOptimization?.title}
                  detail={report.s8_growth_recommendations.revenueOptimization?.prediction}
                  meta={`Trigger: ${report.s8_growth_recommendations.revenueOptimization?.triggerCondition || "—"}`}
                />
              </div>
            </SectionShell>

            {/* S9 */}
            <SectionShell number={9} title="Forecast · Next Month" anchor="ri-section-9">
              <div className="flex flex-wrap items-center gap-6 mb-5">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[var(--fos-muted)]">Expected Growth</div>
                  <div className="text-2xl font-bold text-[var(--fos-text)] tabular-nums">
                    {safe(report.s9_forecast_next_month.expectedGrowthRange)}
                  </div>
                </div>
                <div className="flex-1 min-w-[180px]">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[var(--fos-muted)] mb-1.5">
                    <span>Confidence</span>
                    <span className="text-cyan-400 tabular-nums">{safe(report.s9_forecast_next_month.confidenceLevel)}{typeof report.s9_forecast_next_month.confidenceLevel === "number" ? "%" : ""}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--fos-border)] overflow-hidden">
                    <div
                      className="h-full bg-cyan-400"
                      style={{ width: `${Math.max(0, Math.min(100, Number(report.s9_forecast_next_month.confidenceLevel) || 0))}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ForecastCol title="Key Drivers" tone="cyan" items={(report.s9_forecast_next_month.keyDrivers || []).slice(0, 3)} icon={<CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />} />
                <ForecastCol title="Watch Items" tone="amber" items={report.s9_forecast_next_month.watchItems || []} icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-400" />} />
                <ForecastCol title="Recommended Actions" tone="cyan" items={report.s9_forecast_next_month.recommendedActions || []} icon={<ArrowRight className="w-3.5 h-3.5 text-cyan-400" />} />
              </div>
            </SectionShell>

            {/* S10 */}
            <SectionShell number={10} title="Net Business Impact">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
                <MetricTile label="Revenue Generated" value={safe(s10.totalRevenueImpact)} />
                <MetricTile label="Cost Savings" value={safe(s10.totalCostSavings)} />
                <MetricTile label="ROI Multiplier" value={safe(s10.totalROIEstimate)} highlight />
                <div className="founder-kpi p-4 rounded-lg flex items-center justify-center">
                  <Gauge value={Number(s10.hostflowValueScore) || 0} size={92} label="HostFlow Score" />
                </div>
              </div>
              <div className="border-t border-[var(--fos-border)] pt-5">
                <p className="text-[var(--fos-text)] text-lg md:text-xl leading-relaxed text-center max-w-3xl mx-auto">
                  {safe(s10.verdictOneLiner)}
                </p>
                <p className="text-center text-[10px] text-[var(--fos-muted)] mt-4 uppercase tracking-[0.2em]">
                  Powered by revenuereport@hostflowai.net
                </p>
              </div>
            </SectionShell>
          </div>

          {/* Live feed (sticky) */}
          <div className="hidden xl:block">
            <div className="sticky top-20">
              <LiveFeed active={liveOn} />
            </div>
          </div>

          {/* Inline live feed for smaller breakpoints */}
          {liveOn && (
            <div className="xl:hidden">
              <LiveFeed active={liveOn} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RecCard({
  icon, badge, badgeTone, title, detail, meta,
}: {
  icon: React.ReactNode;
  badge: string;
  badgeTone: "red" | "amber" | "blue" | "cyan";
  title?: string;
  detail?: string;
  meta?: string;
}) {
  const toneCls: Record<string, string> = {
    red: "bg-red-500/10 text-red-400 border-red-500/30",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  };
  return (
    <div className="founder-kpi p-4 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[var(--fos-muted)]">{icon}</span>
        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${toneCls[badgeTone]}`}>
          {badge}
        </span>
      </div>
      <div className="text-[var(--fos-text)] font-semibold text-sm">{title || "—"}</div>
      <p className="text-[var(--fos-muted)] text-xs mt-1.5 leading-relaxed">{detail || "—"}</p>
      {meta && <p className="text-cyan-400 text-[11px] tabular-nums mt-2">{meta}</p>}
    </div>
  );
}

function ForecastCol({ title, items, icon }: { title: string; tone: string; items: string[]; icon: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--fos-muted)] mb-2">{title}</div>
      <ul className="space-y-2">
        {items.length === 0 && <li className="text-[var(--fos-muted)] text-xs italic">—</li>}
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-[var(--fos-text)] leading-relaxed">
            <span className="mt-0.5 shrink-0">{icon}</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ShieldHidden() {
  return (
    <div>
      <XCircle className="w-8 h-8 mx-auto text-red-400 mb-3" />
      <h3 className="text-[var(--fos-text)] text-lg font-semibold mb-1">Founder access required</h3>
      <p className="text-[var(--fos-muted)] text-sm">Revenue Intelligence is restricted to the founder account.</p>
    </div>
  );
}