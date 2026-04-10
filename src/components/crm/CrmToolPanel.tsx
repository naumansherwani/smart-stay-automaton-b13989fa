import type { IndustryType } from "@/lib/industryConfig";
import type { CrmToolConfig } from "@/lib/crmConfig";
import { getIndustryConfig } from "@/lib/industryConfig";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, PenLine, Wrench, TrendingUp, ArrowRight, MapPin, BarChart3, Sparkles, Clock, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CrmTasksPanel from "./CrmTasksPanel";
import CrmDailyPlanPanel from "./CrmDailyPlanPanel";

interface Props {
  toolId: string;
  industry: IndustryType;
  tool: CrmToolConfig;
}

export default function CrmToolPanel({ toolId, industry, tool }: Props) {
  const industryConfig = getIndustryConfig(industry);
  const navigate = useNavigate();

  const toolContent: Record<string, React.ReactNode> = {
    "smart-tasks": <CrmTasksPanel industry={industry} />,
    "daily-planner": <CrmDailyPlanPanel industry={industry} />,
    "ai-calendar": (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold">AI Smart Scheduling</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                AI automatically optimizes your {industryConfig.bookingLabelPlural.toLowerCase()} based on demand patterns, resource availability, and historical data.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm"><Sparkles className="h-3 w-3 text-primary" />Auto-fill gaps in schedule</div>
                <div className="flex items-center gap-2 text-sm"><Sparkles className="h-3 w-3 text-primary" />Predict peak demand periods</div>
                <div className="flex items-center gap-2 text-sm"><Sparkles className="h-3 w-3 text-primary" />Smart conflict resolution</div>
              </div>
              <Button className="w-full mt-4" onClick={() => navigate("/dashboard")}>
                Open AI Calendar <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-5 w-5 text-purple-500" />
                <h3 className="font-semibold">Upcoming Schedule</h3>
              </div>
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <div>
                      <p className="text-sm font-medium">{industryConfig.bookingLabel} #{i}</p>
                      <p className="text-xs text-muted-foreground">Today +{i}h</p>
                    </div>
                    <Badge variant="outline" className="text-xs">AI Optimized</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    ),
    "ai-pricing": (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="h-8 w-8 mx-auto text-green-500 mb-2" />
              <p className="text-2xl font-bold">AI Price</p>
              <p className="text-sm text-muted-foreground">Dynamic pricing engine</p>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-sm"><span>Base Rate</span><span className="font-medium">Calculated</span></div>
                <div className="flex justify-between text-sm"><span>Demand Factor</span><span className="font-medium text-green-600">+12%</span></div>
                <div className="flex justify-between text-sm"><span>Competition</span><span className="font-medium text-orange-600">-3%</span></div>
              </div>
              <Button className="w-full mt-4" onClick={() => navigate("/dashboard")}>
                Configure AI Pricing <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Revenue Impact</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Revenue up 18% with AI</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Optimal pricing 92% accuracy</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">Real-time market adjustments</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Price Suggestions</h3>
              <div className="space-y-2">
                {["Low Demand", "Peak Hours", "Weekend"].map(period => (
                  <div key={period} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                    <span>{period}</span>
                    <Badge variant="secondary" className="text-xs">AI Set</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    ),
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
    "ai-scheduling": (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-5 w-5 text-purple-500" />
                <h3 className="font-semibold">Intelligent Scheduling</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                AI schedules {industryConfig.bookingLabelPlural.toLowerCase()} based on {industryConfig.resourceLabelPlural.toLowerCase()} availability, {industryConfig.clientLabelPlural.toLowerCase()} preferences, and past patterns.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm"><Sparkles className="h-3 w-3 text-primary" />Auto-assign {industryConfig.resourceLabelPlural.toLowerCase()}</div>
                <div className="flex items-center gap-2 text-sm"><Sparkles className="h-3 w-3 text-primary" />Reduce no-shows with reminders</div>
                <div className="flex items-center gap-2 text-sm"><Sparkles className="h-3 w-3 text-primary" />Optimize turnaround times</div>
              </div>
              <Button className="w-full mt-4" onClick={() => navigate("/dashboard")}>
                Open Scheduler <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Today's Schedule</h3>
              <div className="space-y-2">
                {["9:00 AM", "11:30 AM", "2:00 PM", "4:30 PM"].map(time => (
                  <div key={time} className="flex items-center gap-3 p-2 bg-muted/50 rounded text-sm">
                    <span className="text-muted-foreground w-16">{time}</span>
                    <span className="font-medium">{industryConfig.bookingLabel}</span>
                    <Badge variant="outline" className="text-xs ml-auto">Confirmed</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
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
