import { useState } from "react";
import type { IndustryType } from "@/lib/industryConfig";
import type { CrmToolConfig } from "@/lib/crmConfig";
import { getIndustryConfig } from "@/lib/industryConfig";
import { supportsAutoPricing } from "@/lib/industryFeatures";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, PenLine, Wrench, TrendingUp, ArrowRight, MapPin, BarChart3, Sparkles, Clock, Zap, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import CrmTasksPanel from "./CrmTasksPanel";
import CrmDailyPlanPanel from "./CrmDailyPlanPanel";
import CrmGoogleSyncPanel from "./CrmGoogleSyncPanel";

interface Props {
  toolId: string;
  industry: IndustryType;
  tool: CrmToolConfig;
}

// Embedded AI Calendar component for CRM
function CrmAICalendarEmbed({ industry }: { industry: IndustryType }) {
  const config = getIndustryConfig(industry);
  const [optimizing, setOptimizing] = useState(false);

  const handleOptimize = () => {
    setOptimizing(true);
    setTimeout(() => {
      setOptimizing(false);
      toast.success("AI optimized your schedule — 3 gaps filled, 2 conflicts resolved!");
    }, 2000);
  };

  const todaySlots = [
    { time: "09:00", label: `${config.bookingLabel} — Room A`, status: "confirmed", ai: true },
    { time: "10:30", label: `${config.bookingLabel} — Room B`, status: "confirmed", ai: false },
    { time: "12:00", label: "AI Gap Fill Suggestion", status: "ai-suggestion", ai: true },
    { time: "14:00", label: `${config.bookingLabel} — Room A`, status: "confirmed", ai: true },
    { time: "16:00", label: `${config.bookingLabel} — Room C`, status: "pending", ai: false },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">Live Sync</span>
        </div>
        <Button size="sm" variant="outline" onClick={handleOptimize} disabled={optimizing}>
          {optimizing ? <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
          {optimizing ? "Optimizing..." : "AI Optimize Schedule"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Today's AI Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {todaySlots.map((slot, i) => (
              <div key={i} className={`flex items-center gap-3 p-2.5 rounded-lg text-sm transition-colors ${
                slot.status === "ai-suggestion" 
                  ? "bg-purple-500/10 border border-purple-500/20 border-dashed" 
                  : slot.status === "pending" 
                    ? "bg-yellow-500/10 border border-yellow-500/20" 
                    : "bg-muted/50"
              }`}>
                <span className="text-muted-foreground font-mono w-12 shrink-0">{slot.time}</span>
                <span className="font-medium flex-1">{slot.label}</span>
                <div className="flex items-center gap-1.5">
                  {slot.ai && <Sparkles className="h-3 w-3 text-purple-500" />}
                  <Badge variant={slot.status === "confirmed" ? "default" : slot.status === "ai-suggestion" ? "secondary" : "outline"} className="text-[10px]">
                    {slot.status === "ai-suggestion" ? "AI Suggestion" : slot.status === "confirmed" ? "Confirmed" : "Pending"}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-3">AI Schedule Insights</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>Auto-fill gaps in schedule</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>Predict peak demand periods</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>Smart conflict resolution</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>Double-booking prevention</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-2">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2 bg-muted/50 rounded">
                  <p className="text-lg font-bold text-primary">94%</p>
                  <p className="text-[10px] text-muted-foreground">Occupancy</p>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded">
                  <p className="text-lg font-bold text-green-600">3</p>
                  <p className="text-[10px] text-muted-foreground">AI Fills Today</p>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded">
                  <p className="text-lg font-bold text-orange-500">0</p>
                  <p className="text-[10px] text-muted-foreground">Conflicts</p>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded">
                  <p className="text-lg font-bold text-purple-500">12</p>
                  <p className="text-[10px] text-muted-foreground">Total Slots</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Embedded AI Pricing component for CRM
function CrmAIPricingEmbed({ industry }: { industry: IndustryType }) {
  const config = getIndustryConfig(industry);
  const [recalculating, setRecalculating] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleRecalculate = () => {
    setRecalculating(true);
    setTimeout(() => {
      setRecalculating(false);
      toast.success("AI pricing recalculated — 5 prices adjusted based on current demand!");
    }, 2000);
  };

  const pricingData = industry === "airlines" ? [
    { route: "NYC → LAX", base: "$320", ai: "$389", change: "+21%", demand: "High" },
    { route: "CHI → MIA", base: "$210", ai: "$245", change: "+17%", demand: "Medium" },
    { route: "SFO → SEA", base: "$150", ai: "$138", change: "-8%", demand: "Low" },
  ] : industry === "hospitality" ? [
    { route: "Deluxe Suite", base: "$250", ai: "$310", change: "+24%", demand: "High" },
    { route: "Standard Room", base: "$120", ai: "$145", change: "+21%", demand: "High" },
    { route: "Economy Room", base: "$80", ai: "$72", change: "-10%", demand: "Low" },
  ] : industry === "car_rental" ? [
    { route: "SUV Premium", base: "$95/day", ai: "$118/day", change: "+24%", demand: "High" },
    { route: "Sedan Standard", base: "$55/day", ai: "$62/day", change: "+13%", demand: "Medium" },
    { route: "Compact", base: "$35/day", ai: "$31/day", change: "-11%", demand: "Low" },
  ] : industry === "railways" ? [
    { route: "Express 1st Class", base: "$85", ai: "$102", change: "+20%", demand: "High" },
    { route: "Express Economy", base: "$45", ai: "$52", change: "+16%", demand: "Medium" },
    { route: "Local Economy", base: "$15", ai: "$13", change: "-13%", demand: "Low" },
  ] : [
    { route: "VIP Package", base: "$500", ai: "$620", change: "+24%", demand: "High" },
    { route: "Standard Ticket", base: "$75", ai: "$89", change: "+19%", demand: "Medium" },
    { route: "Early Bird", base: "$45", ai: "$38", change: "-16%", demand: "Low" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">Live Market Data</span>
        </div>
        <Button size="sm" variant="outline" onClick={handleRecalculate} disabled={recalculating}>
          {recalculating ? <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> : <Zap className="h-3 w-3 mr-1" />}
          {recalculating ? "Recalculating..." : "Recalculate Prices"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-500/20">
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold">+18%</p>
            <p className="text-sm text-muted-foreground">Revenue Increase with AI</p>
          </CardContent>
        </Card>
        <Card className="border-blue-500/20">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold">92%</p>
            <p className="text-sm text-muted-foreground">Pricing Accuracy</p>
          </CardContent>
        </Card>
        <Card className="border-purple-500/20">
          <CardContent className="p-4 text-center">
            <Sparkles className="h-8 w-8 mx-auto text-purple-500 mb-2" />
            <p className="text-2xl font-bold">24/7</p>
            <p className="text-sm text-muted-foreground">Real-time Adjustments</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              AI Price Recommendations
            </span>
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setShowDetails(!showDetails)}>
              {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {showDetails ? "Less" : "Details"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {pricingData.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{item.route}</p>
                  <p className="text-xs text-muted-foreground">Base: {item.base}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-bold">{item.ai}</p>
                    <p className={`text-xs font-medium ${item.change.startsWith("+") ? "text-green-600" : "text-red-500"}`}>
                      {item.change}
                    </p>
                  </div>
                  <Badge variant={item.demand === "High" ? "default" : item.demand === "Medium" ? "secondary" : "outline"} className="text-[10px]">
                    {item.demand}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          {showDetails && (
            <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
              <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-primary" /> AI Pricing Factors
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>• Demand patterns (real-time)</div>
                <div>• Competitor prices</div>
                <div>• Seasonal trends</div>
                <div>• Historical booking data</div>
                <div>• Time to departure/check-in</div>
                <div>• Capacity utilization</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function CrmToolPanel({ toolId, industry, tool }: Props) {
  const industryConfig = getIndustryConfig(industry);
  const navigate = useNavigate();

  const toolContent: Record<string, React.ReactNode> = {
    "smart-tasks": <CrmTasksPanel industry={industry} />,
    "daily-planner": <CrmDailyPlanPanel industry={industry} />,
    "google-sync": <CrmGoogleSyncPanel industry={industry} />,
    "ai-calendar": <CrmAICalendarEmbed industry={industry} />,
    "ai-pricing": supportsAutoPricing(industry) ? <CrmAIPricingEmbed industry={industry} /> : (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          AI Pricing is not available for {industryConfig.label}. This feature is designed for industries with dynamic demand-based pricing.
        </CardContent>
      </Card>
    ),
    "ai-scheduling": <CrmAICalendarEmbed industry={industry} />,
    "manual-booking": (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <PenLine className="h-6 w-6 text-orange-500" />
              <div>
                <h3 className="font-semibold">Manual {industryConfig.bookingLabel}</h3>
                <p className="text-sm text-muted-foreground">Create a new {industryConfig.bookingLabel.toLowerCase()} with full control over all details</p>
              </div>
            </div>
            <Button className="w-full" onClick={() => navigate("/dashboard")}>
              Create {industryConfig.bookingLabel} in Dashboard <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    ),
    "resource-mgmt": (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Wrench className="h-6 w-6 text-slate-500" />
              <div>
                <h3 className="font-semibold">{industryConfig.resourceLabelPlural} Manager</h3>
                <p className="text-sm text-muted-foreground">Manage all your {industryConfig.resourceLabelPlural.toLowerCase()}, availability, and maintenance</p>
              </div>
            </div>
            <Button className="w-full" onClick={() => navigate("/dashboard")}>
              Manage {industryConfig.resourceLabelPlural} <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    ),
    "fleet-mgmt": (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Wrench className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="font-semibold">Fleet Manager</h3>
                <p className="text-sm text-muted-foreground">Track vehicles, maintenance schedules, and utilization across your fleet</p>
              </div>
            </div>
            <Button className="w-full" onClick={() => navigate("/dashboard")}>
              Open Fleet Manager <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    ),
    "route-optimizer": (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-5 w-5 text-teal-500" />
                <h3 className="font-semibold">AI Route Optimization</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                AI calculates optimal routes considering distance, time, traffic, and costs.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm"><Sparkles className="h-3 w-3 text-primary" />Multi-stop optimization</div>
                <div className="flex items-center gap-2 text-sm"><Sparkles className="h-3 w-3 text-primary" />Real-time traffic adjustment</div>
                <div className="flex items-center gap-2 text-sm"><Sparkles className="h-3 w-3 text-primary" />Fuel cost minimization</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Route Analytics</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span>Avg Route Time</span><span className="font-bold">2.4h</span></div>
                <div className="flex justify-between text-sm"><span>Fuel Savings</span><span className="font-bold text-green-600">-15%</span></div>
                <div className="flex justify-between text-sm"><span>On-Time Rate</span><span className="font-bold">94%</span></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    ),
    "capacity-planner": (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-5 w-5 text-amber-500" />
                <h3 className="font-semibold">Capacity Planner</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                AI predicts capacity needs and helps prevent overbooking or under-utilization.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm"><Sparkles className="h-3 w-3 text-primary" />Demand forecasting</div>
                <div className="flex items-center gap-2 text-sm"><Sparkles className="h-3 w-3 text-primary" />Overbooking prevention</div>
                <div className="flex items-center gap-2 text-sm"><Sparkles className="h-3 w-3 text-primary" />Resource allocation AI</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Current Capacity</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span>Today</span><span className="font-bold">78%</span></div>
                <div className="flex justify-between text-sm"><span>This Week</span><span className="font-bold">65%</span></div>
                <div className="flex justify-between text-sm"><span>Next Week (Predicted)</span><span className="font-bold text-amber-600">82%</span></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    ),
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{tool.icon}</span>
        <h2 className="text-lg font-semibold">{tool.label}</h2>
        <Badge variant="secondary" className="text-xs">Premium</Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-4">{tool.description}</p>
      {toolContent[toolId] || (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Tool coming soon for {industryConfig.label}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
