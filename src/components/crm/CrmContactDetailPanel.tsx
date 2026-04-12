import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  User, Mail, Phone, Building2, MapPin, ArrowLeft, Edit2, Save, X,
  Calendar, FileText, CheckSquare, Sparkles, TrendingUp, DollarSign,
  TicketCheck, Clock, Activity, Tag, AlertTriangle, Star, MessageSquare,
  Crown, Plane, Armchair, UtensilsCrossed, MapPinned, Mic, Loader2, RefreshCw,
  Heart, Thermometer, ShieldAlert, Pill, Brain, Gauge, Stethoscope, Volume2,
} from "lucide-react";
import type { CrmContact, CrmTicket, CrmDeal, CrmActivity } from "@/hooks/useCrm";
import { getCrmConfig } from "@/lib/crmConfig";
import type { IndustryType } from "@/lib/industryConfig";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { toast } from "sonner";
import CrmAiEmailComposer from "./CrmAiEmailComposer";

interface Props {
  contact: CrmContact;
  industry: IndustryType;
  onBack: () => void;
  onUpdate: (id: string, updates: Record<string, unknown>) => Promise<{ error: any }>;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  call: <Phone className="h-3 w-3 text-green-500" />,
  email: <Mail className="h-3 w-3 text-blue-500" />,
  meeting: <Calendar className="h-3 w-3 text-purple-500" />,
  note: <FileText className="h-3 w-3 text-yellow-500" />,
  task: <CheckSquare className="h-3 w-3 text-orange-500" />,
  flight: <Plane className="h-3 w-3 text-sky-500" />,
};

// ─── Airline helpers ────────────────────────────────────────────────────────
function getLoyaltyTier(contact: CrmContact): { tier: string; color: string; icon: string } {
  const rev = contact.total_revenue || 0;
  const bookings = contact.total_bookings || 0;
  if (rev >= 10000 || bookings >= 20) return { tier: "Platinum", color: "bg-gradient-to-r from-purple-500 to-indigo-500 text-white", icon: "👑" };
  if (rev >= 5000 || bookings >= 10) return { tier: "Gold", color: "bg-gradient-to-r from-yellow-500 to-amber-500 text-white", icon: "⭐" };
  if (rev >= 2000 || bookings >= 5) return { tier: "Silver", color: "bg-gradient-to-r from-slate-400 to-slate-500 text-white", icon: "🥈" };
  return { tier: "Bronze", color: "bg-gradient-to-r from-orange-700 to-amber-800 text-white", icon: "🥉" };
}

function getSentimentBadge(contact: CrmContact, openTickets: number): { label: string; emoji: string; glow: string } {
  if (openTickets >= 2 || contact.churn_risk === "high") return { label: "Unhappy", emoji: "😡", glow: "shadow-red-500/40 shadow-lg" };
  if (openTickets >= 1 || contact.churn_risk === "medium") return { label: "Neutral", emoji: "😐", glow: "shadow-yellow-500/30 shadow-md" };
  return { label: "Happy", emoji: "😊", glow: "shadow-green-500/30 shadow-md" };
}

function getCLV(contact: CrmContact): number {
  const avgBookingValue = (contact.total_revenue || 0) / Math.max(contact.total_bookings || 1, 1);
  const estimatedYearsRemaining = 5;
  const bookingsPerYear = Math.max((contact.total_bookings || 0) / 2, 1);
  return Math.round(avgBookingValue * bookingsPerYear * estimatedYearsRemaining);
}

// Simulated preferences & travel history for airlines
function getPassengerPreferences(contact: CrmContact) {
  const tags = contact.tags || [];
  return {
    seat: tags.includes("aisle") ? "Aisle" : tags.includes("middle") ? "Middle" : "Window",
    meal: tags.includes("vegan") ? "Vegan" : tags.includes("halal") ? "Halal" : tags.includes("vegetarian") ? "Vegetarian" : "Standard",
    routes: tags.filter(t => t.includes("→")).slice(0, 3),
    extraLegroom: tags.includes("legroom"),
  };
}

const MOCK_FLIGHT_HISTORY = [
  { flight: "AI-101", route: "JFK → LAX", date: "2026-03-28", status: "Arrived", delay: 0 },
  { flight: "AI-305", route: "LHR → DXB", date: "2026-03-15", status: "Arrived", delay: 25 },
  { flight: "AI-202", route: "LAX → ORD", date: "2026-02-20", status: "Delayed", delay: 90 },
  { flight: "AI-618", route: "DXB → BOM", date: "2026-01-10", status: "Arrived", delay: 0 },
  { flight: "AI-410", route: "SIN → HKG", date: "2025-12-22", status: "Cancelled", delay: 0 },
];

export default function CrmContactDetailPanel({ contact, industry, onBack, onUpdate }: Props) {
  const config = getCrmConfig(industry);
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: contact.name,
    email: contact.email || "",
    phone: contact.phone || "",
    company: contact.company || "",
    address: contact.address || "",
    notes: contact.notes || "",
    lifecycle_stage: contact.lifecycle_stage,
    tags: (contact.tags || []).join(", "),
  });
  const [linkedDeals, setLinkedDeals] = useState<CrmDeal[]>([]);
  const [linkedTickets, setLinkedTickets] = useState<CrmTicket[]>([]);
  const [activities, setActivities] = useState<CrmActivity[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const isAirline = industry === "airlines";
  const loyalty = getLoyaltyTier(contact);
  const clv = getCLV(contact);
  const prefs = isAirline ? getPassengerPreferences(contact) : null;

  const fetchRelated = useCallback(async () => {
    if (!user) return;
    setLoadingRelated(true);
    const [dealsRes, ticketsRes, activitiesRes] = await Promise.all([
      supabase.from("crm_deals").select("*").eq("contact_id", contact.id).order("created_at", { ascending: false }).limit(10),
      supabase.from("crm_tickets").select("*").eq("contact_id", contact.id).order("created_at", { ascending: false }).limit(10),
      supabase.from("crm_activities").select("*").eq("contact_id", contact.id).order("created_at", { ascending: false }).limit(20),
    ]);
    setLinkedDeals((dealsRes.data as unknown as CrmDeal[]) || []);
    setLinkedTickets((ticketsRes.data as unknown as CrmTicket[]) || []);
    setActivities((activitiesRes.data as unknown as CrmActivity[]) || []);
    setLoadingRelated(false);
  }, [user, contact.id]);

  useEffect(() => { fetchRelated(); }, [fetchRelated]);

  const handleSave = async () => {
    const updates: Record<string, unknown> = {
      name: form.name,
      email: form.email || null,
      phone: form.phone || null,
      company: form.company || null,
      address: form.address || null,
      notes: form.notes || null,
      lifecycle_stage: form.lifecycle_stage,
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
    };
    const { error } = await onUpdate(contact.id, updates);
    if (error) toast.error("Update failed");
    else { toast.success("Contact updated"); setEditing(false); }
  };

  const generateAiSummary = async () => {
    setAiSummaryLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("crm-ai-assistant", {
        body: {
          action: "score_contact",
          data: {
            name: contact.name,
            total_bookings: contact.total_bookings || 0,
            total_revenue: contact.total_revenue || 0,
            lifecycle_stage: contact.lifecycle_stage,
            last_contacted_at: contact.last_contacted_at,
            industry,
          },
        },
      });
      if (error) throw error;
      setAiSummary(data?.reason || "No summary available.");
    } catch {
      toast.error("AI summary failed");
    } finally {
      setAiSummaryLoading(false);
    }
  };

  useEffect(() => {
    if (isAirline && !aiSummary && !aiSummaryLoading) {
      generateAiSummary();
    }
  }, [isAirline]);

  const totalDealValue = linkedDeals.reduce((s, d) => s + (d.value || 0), 0);
  const wonDeals = linkedDeals.filter(d => d.stage === "Won").length;
  const openTickets = linkedTickets.filter(t => t.status === "open" || t.status === "in_progress").length;
  const sentiment = getSentimentBadge(contact, openTickets);

  const healthScore = Math.min(100, Math.max(0,
    (contact.ai_score || 0) +
    (contact.total_bookings || 0) * 5 +
    (wonDeals * 10) -
    (openTickets * 15) -
    (contact.churn_risk === "high" ? 30 : contact.churn_risk === "medium" ? 15 : 0)
  ));
  const healthColor = healthScore >= 70 ? "text-green-500" : healthScore >= 40 ? "text-yellow-500" : "text-red-500";

  return (
    <div className="space-y-4">
      {/* ─── HEADER: Quick Snapshot ─── */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
        <div className="flex items-center gap-3">
          {/* Photo / Initials */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${isAirline ? "bg-gradient-to-br from-sky-600 to-blue-800 text-white" : "bg-primary/10 text-primary"}`}>
            {contact.avatar_url ? <img src={contact.avatar_url} className="w-full h-full rounded-full object-cover" /> : contact.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold">{contact.name}</h2>
              {isAirline && (
                <Badge className={`${loyalty.color} text-xs`}>{loyalty.icon} {loyalty.tier}</Badge>
              )}
              <Badge className={`${config.lifecycleStages.find(s => s.value === contact.lifecycle_stage)?.color || "bg-muted"} text-white text-xs`}>
                {config.lifecycleStages.find(s => s.value === contact.lifecycle_stage)?.label || contact.lifecycle_stage}
              </Badge>
              {contact.churn_risk === "high" && <Badge variant="destructive" className="text-xs"><AlertTriangle className="h-3 w-3 mr-1" />Churn Risk</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">{contact.company || "No company"} • Added {format(new Date(contact.created_at), "MMM d, yyyy")}</p>
          </div>
        </div>

        {/* Center: CLV */}
        {isAirline && (
          <div className="ml-auto flex items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Customer Lifetime Value</p>
              <p className="text-2xl font-bold text-green-500">${clv.toLocaleString()}</p>
            </div>
            {/* Sentiment Badge */}
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${sentiment.glow}`}>
              {sentiment.emoji}
            </div>
          </div>
        )}

        {/* Edit / Actions */}
        <div className="flex gap-2 ml-auto">
          {!editing ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}><Edit2 className="h-4 w-4 mr-1" />Edit</Button>
              <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline"><Mail className="h-4 w-4 mr-1" />AI Email</Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                  <DialogHeader><DialogTitle>AI Email Composer</DialogTitle></DialogHeader>
                  <CrmAiEmailComposer industry={industry} preselectedContactId={contact.id} />
                </DialogContent>
              </Dialog>
              <Button size="sm" variant="outline" onClick={() => toast.info("Voice note recording coming soon!")}>
                <Mic className="h-4 w-4 mr-1" />Voice Note
              </Button>
            </>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}><Save className="h-4 w-4 mr-1" />Save</Button>
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}><X className="h-4 w-4" /></Button>
            </div>
          )}
        </div>
      </div>

      {/* ─── SCORE CARDS ─── */}
      <div className={`grid gap-3 ${isAirline ? "grid-cols-2 md:grid-cols-6" : "grid-cols-2 md:grid-cols-5"}`}>
        <Card>
          <CardContent className="p-3 text-center">
            <Star className={`h-5 w-5 mx-auto mb-1 ${healthColor}`} />
            <p className="text-xl font-bold">{healthScore}</p>
            <p className="text-xs text-muted-foreground">Health Score</p>
            <Progress value={healthScore} className="mt-1 h-1" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Sparkles className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-xl font-bold">{contact.ai_score || 0}</p>
            <p className="text-xs text-muted-foreground">AI Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <DollarSign className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <p className="text-xl font-bold">${(contact.total_revenue || 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Calendar className="h-5 w-5 mx-auto mb-1 text-blue-500" />
            <p className="text-xl font-bold">{contact.total_bookings || 0}</p>
            <p className="text-xs text-muted-foreground">{isAirline ? "Flights" : "Bookings"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-purple-500" />
            <p className="text-xl font-bold">${totalDealValue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Deal Value</p>
          </CardContent>
        </Card>
        {isAirline && (
          <Card>
            <CardContent className="p-3 text-center">
              <Crown className={`h-5 w-5 mx-auto mb-1 ${loyalty.tier === "Platinum" ? "text-purple-500" : loyalty.tier === "Gold" ? "text-yellow-500" : "text-slate-400"}`} />
              <p className="text-xl font-bold">{loyalty.tier}</p>
              <p className="text-xs text-muted-foreground">Loyalty Tier</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ─── LEFT COLUMN: AI Intelligence ─── */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2"><CardTitle className="text-sm">
            {isAirline ? "Passenger Intelligence" : "Contact Info"}
          </CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {/* AI Summary (Airlines) */}
            {isAirline && (
              <div className="p-3 rounded-lg bg-gradient-to-br from-sky-500/5 to-blue-500/5 border border-sky-500/10">
                <p className="text-xs font-medium text-sky-600 flex items-center gap-1 mb-1.5"><Sparkles className="h-3 w-3" />AI Passenger Summary</p>
                {aiSummaryLoading ? (
                  <div className="flex items-center gap-2 py-2"><Loader2 className="h-3 w-3 animate-spin" /><span className="text-xs text-muted-foreground">Generating...</span></div>
                ) : (
                  <p className="text-xs leading-relaxed">{aiSummary || contact.ai_score_reason || "Click to generate AI summary."}</p>
                )}
                {!aiSummaryLoading && (
                  <Button variant="ghost" size="sm" className="mt-1 h-6 text-[10px]" onClick={generateAiSummary}>
                    <RefreshCw className="h-2.5 w-2.5 mr-0.5" />Refresh
                  </Button>
                )}
              </div>
            )}

            {/* Preferences (Airlines) */}
            {isAirline && prefs && (
              <div className="p-2.5 rounded-lg bg-muted/50 space-y-1.5">
                <p className="text-xs font-medium mb-1">Passenger Preferences</p>
                <div className="flex items-center gap-2 text-xs"><Armchair className="h-3 w-3 text-muted-foreground" /><span>Seat: <strong>{prefs.seat}</strong>{prefs.extraLegroom && " (Extra Legroom)"}</span></div>
                <div className="flex items-center gap-2 text-xs"><UtensilsCrossed className="h-3 w-3 text-muted-foreground" /><span>Meal: <strong>{prefs.meal}</strong></span></div>
                {prefs.routes.length > 0 && (
                  <div className="flex items-center gap-2 text-xs"><MapPinned className="h-3 w-3 text-muted-foreground" /><span>Routes: {prefs.routes.join(", ")}</span></div>
                )}
              </div>
            )}

            {editing ? (
              <>
                <div><Label className="text-xs">Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
                <div><Label className="text-xs">Email</Label><Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
                <div><Label className="text-xs">Phone</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
                <div><Label className="text-xs">Company</Label><Input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} /></div>
                <div><Label className="text-xs">Address</Label><Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} /></div>
                <div>
                  <Label className="text-xs">Stage</Label>
                  <Select value={form.lifecycle_stage} onValueChange={v => setForm(p => ({ ...p, lifecycle_stage: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{config.lifecycleStages.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Tags (comma-separated)</Label><Input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} /></div>
                <div><Label className="text-xs">Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} /></div>
              </>
            ) : (
              <>
                {contact.email && <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" /><span>{contact.email}</span></div>}
                {contact.phone && <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /><span>{contact.phone}</span></div>}
                {contact.company && <div className="flex items-center gap-2 text-sm"><Building2 className="h-4 w-4 text-muted-foreground" /><span>{contact.company}</span></div>}
                {contact.address && <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" /><span>{contact.address}</span></div>}
                <div className="flex items-center gap-2 text-sm"><Activity className="h-4 w-4 text-muted-foreground" /><span>Source: {contact.source || "direct"}</span></div>
                {contact.last_contacted_at && (
                  <div className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4 text-muted-foreground" /><span>Last contact: {format(new Date(contact.last_contacted_at), "MMM d")}</span></div>
                )}
                {contact.tags && contact.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {contact.tags.map((tag, i) => <Badge key={i} variant="outline" className="text-xs"><Tag className="h-3 w-3 mr-1" />{tag}</Badge>)}
                  </div>
                )}
                {!isAirline && contact.ai_score_reason && (
                  <div className="mt-2 p-2 bg-primary/5 rounded border border-primary/10">
                    <p className="text-xs font-medium text-primary flex items-center gap-1"><Sparkles className="h-3 w-3" />AI Insight</p>
                    <p className="text-xs mt-1">{contact.ai_score_reason}</p>
                  </div>
                )}
                {contact.notes && (
                  <div className="mt-2 p-2 bg-muted/50 rounded">
                    <p className="text-xs font-medium">Notes</p>
                    <p className="text-xs mt-1 whitespace-pre-line">{contact.notes}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* ─── RIGHT COLUMN: Tabs ─── */}
        <Card className="lg:col-span-2">
          <Tabs defaultValue={isAirline ? "flight-history" : "timeline"}>
            <CardHeader className="pb-0">
              <TabsList className="w-full justify-start">
                {isAirline && (
                  <TabsTrigger value="flight-history" className="text-xs"><Plane className="h-3 w-3 mr-1" />Flight History</TabsTrigger>
                )}
                <TabsTrigger value="timeline" className="text-xs"><Activity className="h-3 w-3 mr-1" />Timeline ({activities.length})</TabsTrigger>
                <TabsTrigger value="deals" className="text-xs"><DollarSign className="h-3 w-3 mr-1" />{config.dealLabelPlural} ({linkedDeals.length})</TabsTrigger>
                <TabsTrigger value="tickets" className="text-xs"><TicketCheck className="h-3 w-3 mr-1" />{config.ticketLabelPlural} ({linkedTickets.length})</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="pt-3">
              {loadingRelated ? (
                <div className="flex justify-center p-8"><div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" /></div>
              ) : (
                <>
                  {/* Flight History (Airlines) */}
                  {isAirline && (
                    <TabsContent value="flight-history" className="mt-0">
                      <ScrollArea className="h-[400px]">
                        <div className="relative pl-6">
                          <div className="absolute left-2 top-0 bottom-0 w-px bg-sky-500/20" />
                          <div className="space-y-3">
                            {MOCK_FLIGHT_HISTORY.map((f, i) => (
                              <div key={i} className="relative">
                                <div className={`absolute -left-4 top-2 h-5 w-5 rounded-full flex items-center justify-center ${
                                  f.status === "Arrived" && f.delay === 0 ? "bg-green-500" : f.status === "Delayed" ? "bg-yellow-500" : f.status === "Cancelled" ? "bg-red-500" : "bg-green-400"
                                }`}>
                                  <Plane className="h-2.5 w-2.5 text-white" />
                                </div>
                                <div className="p-3 bg-muted/30 rounded-lg ml-2 hover:bg-muted/50 transition-colors">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-bold">{f.flight}</span>
                                      <span className="text-xs text-muted-foreground">{f.route}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant={f.status === "Arrived" ? "default" : f.status === "Delayed" ? "secondary" : "destructive"} className="text-[10px]">
                                        {f.status}
                                      </Badge>
                                      {f.delay > 0 && <Badge variant="outline" className="text-[10px] text-yellow-600">+{f.delay}min</Badge>}
                                    </div>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">{format(new Date(f.date), "MMM d, yyyy")}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  )}

                  <TabsContent value="timeline" className="mt-0">
                    <ScrollArea className="h-[400px]">
                      {activities.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-8">No activities yet</p>
                      ) : (
                        <div className="relative pl-6">
                          <div className="absolute left-2 top-0 bottom-0 w-px bg-border" />
                          <div className="space-y-3">
                            {activities.map(a => (
                              <div key={a.id} className="relative">
                                <div className="absolute -left-4 top-2 h-4 w-4 rounded-full bg-background border-2 border-border flex items-center justify-center">
                                  {TYPE_ICONS[a.type] || <FileText className="h-2 w-2" />}
                                </div>
                                <div className="p-2 bg-muted/30 rounded ml-2">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[10px] capitalize">{a.type}</Badge>
                                    {a.ai_generated && <Badge variant="secondary" className="text-[10px]"><Sparkles className="h-2 w-2 mr-0.5" />AI</Badge>}
                                    <span className="text-[10px] text-muted-foreground ml-auto">{format(new Date(a.created_at), "MMM d, h:mm a")}</span>
                                  </div>
                                  {a.subject && <p className="text-sm font-medium mt-1">{a.subject}</p>}
                                  {a.description && <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="deals" className="mt-0">
                    <ScrollArea className="h-[400px]">
                      {linkedDeals.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-8">No {config.dealLabelPlural.toLowerCase()} linked</p>
                      ) : (
                        <div className="space-y-2">
                          {linkedDeals.map(d => (
                            <div key={d.id} className="flex items-center justify-between p-3 bg-muted/30 rounded">
                              <div>
                                <p className="text-sm font-medium">{d.title}</p>
                                <p className="text-xs text-muted-foreground">{d.stage} • ${(d.value || 0).toLocaleString()}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                                  <div className="h-full bg-primary rounded-full" style={{ width: `${d.probability}%` }} />
                                </div>
                                <span className="text-xs text-muted-foreground">{d.probability}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="tickets" className="mt-0">
                    <ScrollArea className="h-[400px]">
                      {linkedTickets.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-8">No {config.ticketLabelPlural.toLowerCase()} linked</p>
                      ) : (
                        <div className="space-y-2">
                          {linkedTickets.map(t => (
                            <div key={t.id} className="flex items-center justify-between p-3 bg-muted/30 rounded">
                              <div>
                                <p className="text-sm font-medium">{t.subject}</p>
                                <p className="text-xs text-muted-foreground">#{t.ticket_number} • {t.category}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={t.status === "open" ? "secondary" : t.status === "resolved" ? "default" : "outline"} className="text-xs capitalize">{t.status}</Badge>
                                <Badge variant={t.priority === "critical" ? "destructive" : "outline"} className="text-xs">{t.priority}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>
                </>
              )}
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
