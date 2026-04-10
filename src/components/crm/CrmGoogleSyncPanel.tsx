import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mail, Calendar, MessageSquare, RefreshCw, Link2, Unlink, Clock, CheckCircle2, AlertCircle, Inbox, CalendarDays, Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import type { IndustryType } from "@/lib/industryConfig";

interface Props {
  industry: IndustryType;
}

export default function CrmGoogleSyncPanel({ industry }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [syncTab, setSyncTab] = useState("emails");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch Google connection status
  const { data: connection, isLoading: connLoading } = useQuery({
    queryKey: ["google-connection", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("crm_google_connections")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch synced items
  const { data: syncedItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["google-synced-items", user?.id, syncTab],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("crm_google_synced_items")
        .select("*")
        .eq("user_id", user.id)
        .eq("item_type", syncTab === "emails" ? "email" : syncTab === "calendar" ? "calendar_event" : "chat")
        .order("item_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!connection,
  });

  // Connect Google account (simulated - creates connection record)
  const connectMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("crm_google_connections")
        .upsert({
          user_id: user.id,
          google_email: user.email || "connected@gmail.com",
          gmail_sync_enabled: true,
          calendar_sync_enabled: true,
          chat_sync_enabled: false,
          sync_status: "connected",
          scopes: ["gmail.readonly", "calendar.readonly"],
        }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["google-connection"] });
      toast.success("Google account connected successfully!");
    },
    onError: () => toast.error("Failed to connect Google account"),
  });

  // Disconnect
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("crm_google_connections")
        .delete()
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["google-connection"] });
      queryClient.invalidateQueries({ queryKey: ["google-synced-items"] });
      toast.success("Google account disconnected");
    },
    onError: () => toast.error("Failed to disconnect"),
  });

  // Toggle sync settings
  const toggleSyncMutation = useMutation({
    mutationFn: async ({ field, value }: { field: string; value: boolean }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("crm_google_connections")
        .update({ [field]: value })
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["google-connection"] });
    },
  });

  // Sync now (simulated - inserts demo data)
  const syncNowMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      // Update last_sync_at
      await supabase
        .from("crm_google_connections")
        .update({ last_sync_at: new Date().toISOString(), sync_status: "syncing" })
        .eq("user_id", user.id);

      // Simulate sync delay
      await new Promise(r => setTimeout(r, 1500));

      // Insert demo synced items if none exist
      const { data: existing } = await supabase
        .from("crm_google_synced_items")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      if (!existing || existing.length === 0) {
        const demoItems = [
          { user_id: user.id, item_type: "email", title: "Re: Booking Confirmation #4521", from_address: "guest@example.com", body_preview: "Thank you for confirming my reservation. Looking forward to...", item_date: new Date().toISOString(), is_read: false, labels: ["inbox", "important"] },
          { user_id: user.id, item_type: "email", title: "Invoice Request - Corporate Package", from_address: "billing@company.com", body_preview: "Please find attached the invoice for the corporate package...", item_date: new Date(Date.now() - 3600000).toISOString(), is_read: true, labels: ["inbox"] },
          { user_id: user.id, item_type: "email", title: "Maintenance Schedule Update", from_address: "team@internal.com", body_preview: "The maintenance team has updated the schedule for next week...", item_date: new Date(Date.now() - 7200000).toISOString(), is_read: true, labels: ["inbox", "work"] },
          { user_id: user.id, item_type: "calendar_event", title: "Team Standup Meeting", body_preview: "Daily sync with the operations team", item_date: new Date().toISOString(), metadata: { location: "Conference Room A", duration: "30min" } },
          { user_id: user.id, item_type: "calendar_event", title: "Client Review - Q2 Performance", body_preview: "Review quarterly KPIs with stakeholders", item_date: new Date(Date.now() + 86400000).toISOString(), metadata: { location: "Zoom", duration: "1h" } },
          { user_id: user.id, item_type: "calendar_event", title: "Property Inspection", body_preview: "Monthly property walkthrough and inspection", item_date: new Date(Date.now() + 172800000).toISOString(), metadata: { location: "On-site", duration: "2h" } },
        ];
        await supabase.from("crm_google_synced_items").insert(demoItems);
      }

      await supabase
        .from("crm_google_connections")
        .update({ sync_status: "connected" })
        .eq("user_id", user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["google-connection"] });
      queryClient.invalidateQueries({ queryKey: ["google-synced-items"] });
      toast.success("Sync completed!");
    },
    onError: () => toast.error("Sync failed"),
  });

  const isConnected = !!connection;
  const filteredItems = syncedItems.filter(item =>
    !searchQuery || item.title?.toLowerCase().includes(searchQuery.toLowerCase()) || item.body_preview?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (connLoading) {
    return <div className="flex items-center justify-center p-8"><div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" /></div>;
  }

  // Not connected state
  if (!isConnected) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold">Connect Google Workspace</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Sync your Gmail, Google Calendar & Chat directly into CRM. View emails, meetings, and messages alongside your contacts and deals.
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Mail className="h-4 w-4" /> Gmail</span>
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Calendar</span>
            <span className="flex items-center gap-1"><MessageSquare className="h-4 w-4" /> Chat</span>
          </div>
          <Button 
            size="lg" 
            onClick={() => connectMutation.mutate()} 
            disabled={connectMutation.isPending}
          >
            {connectMutation.isPending ? (
              <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Connecting...</>
            ) : (
              <><Link2 className="h-4 w-4 mr-2" /> Connect Google Account</>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">Your data stays private. Read-only access only.</p>
        </CardContent>
      </Card>
    );
  }

  // Connected state
  return (
    <div className="space-y-4">
      {/* Connection Status Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">Google Connected</p>
                  <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600">Active</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{connection.google_email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => syncNowMutation.mutate()}
                disabled={syncNowMutation.isPending}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${syncNowMutation.isPending ? "animate-spin" : ""}`} />
                Sync Now
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
              >
                <Unlink className="h-4 w-4 mr-1" /> Disconnect
              </Button>
            </div>
          </div>
          {connection.last_sync_at && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Last synced: {format(new Date(connection.last_sync_at), "PPp")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Sync Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Sync Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-red-500" />
              <span className="text-sm">Gmail Sync</span>
            </div>
            <Switch
              checked={connection.gmail_sync_enabled ?? false}
              onCheckedChange={(v) => toggleSyncMutation.mutate({ field: "gmail_sync_enabled", value: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Calendar Sync</span>
            </div>
            <Switch
              checked={connection.calendar_sync_enabled ?? false}
              onCheckedChange={(v) => toggleSyncMutation.mutate({ field: "calendar_sync_enabled", value: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-green-500" />
              <span className="text-sm">Google Chat Sync</span>
            </div>
            <Switch
              checked={connection.chat_sync_enabled ?? false}
              onCheckedChange={(v) => toggleSyncMutation.mutate({ field: "chat_sync_enabled", value: v })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Synced Data Tabs */}
      <Tabs value={syncTab} onValueChange={setSyncTab}>
        <TabsList>
          <TabsTrigger value="emails" className="flex items-center gap-1.5">
            <Inbox className="h-4 w-4" /> Emails
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" /> Calendar
          </TabsTrigger>
        </TabsList>

        <div className="mt-3">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${syncTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <TabsContent value="emails" className="mt-0">
            <ScrollArea className="h-[400px]">
              {itemsLoading ? (
                <div className="flex items-center justify-center p-8"><div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" /></div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  <Mail className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>No emails synced yet. Click "Sync Now" to fetch your latest emails.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredItems.map((item) => (
                    <div key={item.id} className={`p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${!item.is_read ? "bg-primary/5 border-primary/20" : ""}`}>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-sm truncate ${!item.is_read ? "font-semibold" : "font-medium"}`}>{item.title}</p>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {item.item_date ? format(new Date(item.item_date), "MMM d, h:mm a") : ""}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{item.from_address}</p>
                          <p className="text-xs text-muted-foreground mt-1 truncate">{item.body_preview}</p>
                          {item.labels && item.labels.length > 0 && (
                            <div className="flex gap-1 mt-1.5">
                              {item.labels.map((label: string) => (
                                <Badge key={label} variant="outline" className="text-[10px] px-1.5 py-0">{label}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        {!item.is_read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="calendar" className="mt-0">
            <ScrollArea className="h-[400px]">
              {itemsLoading ? (
                <div className="flex items-center justify-center p-8"><div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" /></div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  <Calendar className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>No calendar events synced yet. Click "Sync Now" to fetch your events.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredItems.map((item) => {
                    const meta = item.metadata as Record<string, string> | null;
                    return (
                      <Card key={item.id} className="overflow-hidden">
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <div className="w-10 text-center shrink-0">
                              <p className="text-xs text-muted-foreground">{item.item_date ? format(new Date(item.item_date), "MMM") : ""}</p>
                              <p className="text-lg font-bold">{item.item_date ? format(new Date(item.item_date), "d") : ""}</p>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{item.body_preview}</p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                {meta?.location && (
                                  <span className="flex items-center gap-1">📍 {meta.location}</span>
                                )}
                                {meta?.duration && (
                                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {meta.duration}</span>
                                )}
                                {item.item_date && (
                                  <span>{format(new Date(item.item_date), "h:mm a")}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
