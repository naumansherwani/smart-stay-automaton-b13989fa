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
import {
  User, Mail, Phone, Building2, MapPin, ArrowLeft, Edit2, Save, X,
  Calendar, FileText, CheckSquare, Sparkles, TrendingUp, DollarSign,
  TicketCheck, Clock, Activity, Tag, AlertTriangle, Star, MessageSquare,
} from "lucide-react";
import type { CrmContact, CrmTicket, CrmDeal, CrmActivity } from "@/hooks/useCrm";
import { getCrmConfig } from "@/lib/crmConfig";
import type { IndustryType } from "@/lib/industryConfig";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { toast } from "sonner";

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
};

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

  const totalDealValue = linkedDeals.reduce((s, d) => s + (d.value || 0), 0);
  const wonDeals = linkedDeals.filter(d => d.stage === "Won").length;
  const openTickets = linkedTickets.filter(t => t.status === "open" || t.status === "in_progress").length;

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
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold">{contact.name}</h2>
            <Badge className={`${config.lifecycleStages.find(s => s.value === contact.lifecycle_stage)?.color || "bg-muted"} text-white text-xs`}>
              {config.lifecycleStages.find(s => s.value === contact.lifecycle_stage)?.label || contact.lifecycle_stage}
            </Badge>
            {contact.churn_risk === "high" && <Badge variant="destructive" className="text-xs"><AlertTriangle className="h-3 w-3 mr-1" />Churn Risk</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{contact.company || "No company"} • Added {format(new Date(contact.created_at), "MMM d, yyyy")}</p>
        </div>
        {!editing ? (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}><Edit2 className="h-4 w-4 mr-1" />Edit</Button>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}><Save className="h-4 w-4 mr-1" />Save</Button>
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}><X className="h-4 w-4" /></Button>
          </div>
        )}
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
            <p className="text-xs text-muted-foreground">Bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-purple-500" />
            <p className="text-xl font-bold">${totalDealValue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Deal Value</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Contact Info */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Contact Info</CardTitle></CardHeader>
          <CardContent className="space-y-3">
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
                {contact.ai_score_reason && (
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

        {/* Right: Tabs for deals, tickets, activity */}
        <Card className="lg:col-span-2">
          <Tabs defaultValue="timeline">
            <CardHeader className="pb-0">
              <TabsList className="w-full justify-start">
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
