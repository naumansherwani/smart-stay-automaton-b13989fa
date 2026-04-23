import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, ArrowLeft, ShieldCheck } from "lucide-react";
import EntDashboard from "@/components/enterprise-crm/EntDashboard";
import EntLeads from "@/components/enterprise-crm/EntLeads";
import EntCompanies from "@/components/enterprise-crm/EntCompanies";
import EntPipeline from "@/components/enterprise-crm/EntPipeline";
import EntTasks from "@/components/enterprise-crm/EntTasks";
import EntNotes from "@/components/enterprise-crm/EntNotes";
import EntAnalytics from "@/components/enterprise-crm/EntAnalytics";

export default function EnterpriseConsole() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Premium header bar */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="sm" onClick={() => navigate("/owner")} className="shrink-0">
              <ArrowLeft className="w-4 h-4 mr-1" /> Owner
            </Button>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold truncate">Enterprise Sales CRM</h1>
              <p className="text-[11px] text-muted-foreground truncate">Multinational pipeline · async sales · GBP / USD / EUR / AED</p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] gap-1 shrink-0 hidden sm:flex">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> Admin Only · Global
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-5">
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="grid grid-cols-4 md:grid-cols-7 h-auto p-1 bg-muted/40">
            <TabsTrigger value="dashboard" className="text-xs">Dashboard</TabsTrigger>
            <TabsTrigger value="leads" className="text-xs">Leads</TabsTrigger>
            <TabsTrigger value="companies" className="text-xs">Companies</TabsTrigger>
            <TabsTrigger value="pipeline" className="text-xs">Pipeline</TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs">Tasks</TabsTrigger>
            <TabsTrigger value="notes" className="text-xs">Notes</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard"><EntDashboard /></TabsContent>
          <TabsContent value="leads"><EntLeads /></TabsContent>
          <TabsContent value="companies"><EntCompanies /></TabsContent>
          <TabsContent value="pipeline"><EntPipeline /></TabsContent>
          <TabsContent value="tasks"><EntTasks /></TabsContent>
          <TabsContent value="notes"><EntNotes /></TabsContent>
          <TabsContent value="analytics"><EntAnalytics /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}