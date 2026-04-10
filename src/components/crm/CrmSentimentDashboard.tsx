import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SmilePlus, Frown, Meh, Heart, TrendingUp, MessageSquare, AlertTriangle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useCrmTickets, useCrmContacts } from "@/hooks/useCrm";
import { getCrmConfig } from "@/lib/crmConfig";
import type { IndustryType } from "@/lib/industryConfig";

interface Props { industry: IndustryType; }

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "hsl(142, 70%, 45%)",
  neutral: "hsl(220, 14%, 60%)",
  negative: "hsl(0, 70%, 50%)",
  frustrated: "hsl(25, 90%, 50%)",
};

const SentimentIcon = ({ sentiment }: { sentiment: string }) => {
  switch (sentiment) {
    case "positive": return <SmilePlus className="h-4 w-4 text-green-500" />;
    case "negative": return <Frown className="h-4 w-4 text-red-500" />;
    case "frustrated": return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    default: return <Meh className="h-4 w-4 text-muted-foreground" />;
  }
};

export default function CrmSentimentDashboard({ industry }: Props) {
  const config = getCrmConfig(industry);
  const { tickets } = useCrmTickets();
  const { contacts } = useCrmContacts();

  const sentimentData = useMemo(() => {
    const counts: Record<string, number> = { positive: 0, neutral: 0, negative: 0 };
    tickets.forEach(t => {
      const s = t.ai_sentiment || "neutral";
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value, color: SENTIMENT_COLORS[name] || SENTIMENT_COLORS.neutral }));
  }, [tickets]);

  const categoryBreakdown = useMemo(() => {
    const cats: Record<string, { positive: number; neutral: number; negative: number }> = {};
    tickets.forEach(t => {
      const cat = t.category || "general";
      if (!cats[cat]) cats[cat] = { positive: 0, neutral: 0, negative: 0 };
      const s = (t.ai_sentiment || "neutral") as "positive" | "neutral" | "negative";
      if (cats[cat][s] !== undefined) cats[cat][s]++;
    });
    return Object.entries(cats).map(([category, data]) => ({ category, ...data }));
  }, [tickets]);

  const totalTickets = tickets.length;
  const positiveRate = totalTickets > 0 ? Math.round((sentimentData.find(d => d.name === "positive")?.value || 0) / totalTickets * 100) : 0;
  const negativeRate = totalTickets > 0 ? Math.round((sentimentData.find(d => d.name === "negative")?.value || 0) / totalTickets * 100) : 0;
  const satisfactionScore = Math.max(0, Math.min(100, 50 + positiveRate - negativeRate));

  // Recent negative tickets
  const recentNegative = tickets
    .filter(t => t.ai_sentiment === "negative" || t.ai_sentiment === "frustrated")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // High-risk contacts (churn risk + negative sentiment)
  const atRiskContacts = contacts.filter(c => c.churn_risk === "high").slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Heart className="h-5 w-5 text-pink-500" />
        <h3 className="text-lg font-semibold">Sentiment Dashboard</h3>
        <Badge variant="secondary" className="text-[10px]">Real-time</Badge>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-3 text-center">
          <Heart className="h-4 w-4 mx-auto text-pink-500 mb-1" />
          <p className="text-xl font-bold">{satisfactionScore}%</p>
          <p className="text-[10px] text-muted-foreground">Satisfaction Score</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <SmilePlus className="h-4 w-4 mx-auto text-green-500 mb-1" />
          <p className="text-xl font-bold text-green-600">{positiveRate}%</p>
          <p className="text-[10px] text-muted-foreground">Positive Rate</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <Frown className="h-4 w-4 mx-auto text-red-500 mb-1" />
          <p className="text-xl font-bold text-red-600">{negativeRate}%</p>
          <p className="text-[10px] text-muted-foreground">Negative Rate</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <MessageSquare className="h-4 w-4 mx-auto text-primary mb-1" />
          <p className="text-xl font-bold">{totalTickets}</p>
          <p className="text-[10px] text-muted-foreground">Total {config.ticketLabelPlural}</p>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pie chart */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Sentiment Distribution</CardTitle></CardHeader>
          <CardContent>
            {totalTickets > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={sentimentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {sentimentData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">No ticket data yet</div>
            )}
          </CardContent>
        </Card>

        {/* Category breakdown */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Sentiment by Category</CardTitle></CardHeader>
          <CardContent>
            {categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={categoryBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="category" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="positive" stackId="a" fill={SENTIMENT_COLORS.positive} />
                  <Bar dataKey="neutral" stackId="a" fill={SENTIMENT_COLORS.neutral} />
                  <Bar dataKey="negative" stackId="a" fill={SENTIMENT_COLORS.negative} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">No category data yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent negative */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500" />Recent Negative Feedback</CardTitle></CardHeader>
          <CardContent>
            {recentNegative.length > 0 ? (
              <div className="space-y-2">
                {recentNegative.map(t => (
                  <div key={t.id} className="flex items-start gap-2 p-2 bg-red-500/5 rounded-lg">
                    <SentimentIcon sentiment={t.ai_sentiment || "neutral"} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{t.subject}</p>
                      <p className="text-[10px] text-muted-foreground">{t.category} · {t.priority}</p>
                      {t.ai_summary && <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{t.ai_summary}</p>}
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">{t.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-4 text-sm text-muted-foreground">No negative feedback 🎉</p>
            )}
          </CardContent>
        </Card>

        {/* At-risk contacts */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-orange-500" />At-Risk Contacts</CardTitle></CardHeader>
          <CardContent>
            {atRiskContacts.length > 0 ? (
              <div className="space-y-2">
                {atRiskContacts.map(c => (
                  <div key={c.id} className="flex items-center gap-2 p-2 bg-orange-500/5 rounded-lg">
                    <Frown className="h-4 w-4 text-orange-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground">{c.lifecycle_stage} · ${(c.total_revenue || 0).toLocaleString()} revenue</p>
                    </div>
                    <Badge variant="destructive" className="text-[10px]">High Risk</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-4 text-sm text-muted-foreground">No at-risk contacts</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
