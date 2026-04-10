import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { useCrmDeals, useCrmContacts, useCrmTickets } from "@/hooks/useCrm";
import { getCrmConfig } from "@/lib/crmConfig";
import type { IndustryType } from "@/lib/industryConfig";
import { TrendingUp, DollarSign, Users, Target } from "lucide-react";

interface Props { industry: IndustryType; }

const COLORS = [
  "hsl(168, 70%, 38%)", "hsl(217, 91%, 60%)", "hsl(280, 65%, 60%)",
  "hsl(40, 96%, 53%)", "hsl(0, 84%, 60%)", "hsl(150, 60%, 40%)",
];

export default function CrmRevenueChart({ industry }: Props) {
  const config = getCrmConfig(industry);
  const { deals } = useCrmDeals();
  const { contacts } = useCrmContacts();
  const { tickets } = useCrmTickets();

  // Pipeline funnel data
  const stages = ["Lead", "Qualified", "Proposal", "Negotiation", "Won"];
  const funnelData = stages.map(stage => ({
    name: stage,
    count: deals.filter(d => d.stage === stage).length,
    value: deals.filter(d => d.stage === stage).reduce((s, d) => s + (d.value || 0), 0),
  }));

  // Revenue by month (simulated from deals)
  const monthData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const monthStr = d.toLocaleString("default", { month: "short" });
    const monthDeals = deals.filter(deal => {
      const created = new Date(deal.created_at);
      return created.getMonth() === d.getMonth() && created.getFullYear() === d.getFullYear();
    });
    return {
      month: monthStr,
      revenue: monthDeals.filter(dd => dd.stage === "Won").reduce((s, dd) => s + (dd.value || 0), 0),
      pipeline: monthDeals.reduce((s, dd) => s + (dd.value || 0), 0),
    };
  });

  // Contact source distribution
  const sourceMap = contacts.reduce<Record<string, number>>((acc, c) => {
    const src = c.source || "direct";
    acc[src] = (acc[src] || 0) + 1;
    return acc;
  }, {});
  const sourceData = Object.entries(sourceMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);

  // Ticket resolution trend
  const ticketData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toLocaleDateString("en", { weekday: "short" });
    const dayTickets = tickets.filter(t => {
      const created = new Date(t.created_at);
      return created.toDateString() === d.toDateString();
    });
    return {
      day: dayStr,
      opened: dayTickets.filter(t => t.status === "open").length,
      resolved: dayTickets.filter(t => t.status === "resolved" || t.status === "closed").length,
    };
  });

  const totalPipeline = deals.filter(d => d.stage !== "Won" && d.stage !== "Lost").reduce((s, d) => s + (d.value || 0), 0);
  const wonRevenue = deals.filter(d => d.stage === "Won").reduce((s, d) => s + (d.value || 0), 0);
  const avgDealSize = deals.length > 0 ? Math.round(deals.reduce((s, d) => s + (d.value || 0), 0) / deals.length) : 0;
  const conversionRate = deals.length > 0 ? Math.round((deals.filter(d => d.stage === "Won").length / deals.length) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-lg font-bold">${wonRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Won Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-lg font-bold">${totalPipeline.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Pipeline Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-lg font-bold">{conversionRate}%</p>
                <p className="text-xs text-muted-foreground">Conversion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-500" />
              <div>
                <p className="text-lg font-bold">${avgDealSize.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Avg {config.dealLabel} Size</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Revenue Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 11 }} />
                <YAxis className="text-xs" tick={{ fontSize: 11 }} tickFormatter={v => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, ""]} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(168, 70%, 38%)" fill="hsl(168, 70%, 38%)" fillOpacity={0.2} name="Won" />
                <Area type="monotone" dataKey="pipeline" stroke="hsl(217, 91%, 60%)" fill="hsl(217, 91%, 60%)" fillOpacity={0.1} name="Pipeline" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pipeline Funnel */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />{config.dealLabel} Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                <Tooltip formatter={(v: number, name: string) => [name === "value" ? `$${v.toLocaleString()}` : v, name === "value" ? "Value" : "Count"]} />
                <Bar dataKey="count" fill="hsl(168, 70%, 38%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Source Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />{config.contactLabel} Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sourceData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No contacts yet</p>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie data={sourceData} cx="50%" cy="50%" outerRadius={70} innerRadius={40} dataKey="value" paddingAngle={2}>
                      {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 flex-1">
                  {sourceData.map((s, i) => (
                    <div key={s.name} className="flex items-center gap-2 text-xs">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="capitalize flex-1 truncate">{s.name.replace(/-/g, " ")}</span>
                      <Badge variant="outline" className="text-[10px]">{s.value}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ticket Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-orange-500" />{config.ticketLabel} Trend (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={ticketData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="opened" fill="hsl(0, 84%, 60%)" radius={[2, 2, 0, 0]} name="Opened" />
                <Bar dataKey="resolved" fill="hsl(150, 60%, 40%)" radius={[2, 2, 0, 0]} name="Resolved" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
