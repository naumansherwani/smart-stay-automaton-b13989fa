import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarClock, Sparkles, Loader2, Clock, Users, MapPin, Video, Phone, Coffee } from "lucide-react";
import { useCrmContacts } from "@/hooks/useCrm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { IndustryType } from "@/lib/industryConfig";

interface Props { industry: IndustryType; }

interface SuggestedSlot {
  date: string;
  time: string;
  duration: string;
  reason: string;
  score: number;
}

const MEETING_TYPES = [
  { value: "intro", label: "Introduction Call", icon: Phone },
  { value: "demo", label: "Product Demo", icon: Video },
  { value: "follow-up", label: "Follow-up", icon: Coffee },
  { value: "negotiation", label: "Negotiation", icon: Users },
  { value: "review", label: "Quarterly Review", icon: CalendarClock },
];

export default function CrmSmartMeetingScheduler({ industry }: Props) {
  const { contacts } = useCrmContacts();
  const [selectedContact, setSelectedContact] = useState("");
  const [meetingType, setMeetingType] = useState("intro");
  const [notes, setNotes] = useState("");
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState<SuggestedSlot[]>([]);
  const [agenda, setAgenda] = useState("");

  const findSlots = async () => {
    setLoading(true);
    try {
      const contact = contacts.find(c => c.id === selectedContact);
      const { data, error } = await supabase.functions.invoke("crm-ai-assistant", {
        body: {
          action: "suggest_meeting",
          data: {
            industry,
            meetingType,
            timezone,
            notes,
            contact: contact ? {
              name: contact.name, lifecycle_stage: contact.lifecycle_stage,
              total_bookings: contact.total_bookings, last_contacted_at: contact.last_contacted_at,
            } : null,
          },
        },
      });
      if (error) throw error;
      setSlots(data?.slots || []);
      setAgenda(data?.agenda || "");
      toast.success("AI suggested optimal meeting times!");
    } catch {
      toast.error("Failed to find meeting slots");
    } finally {
      setLoading(false);
    }
  };

  const MeetingTypeIcon = MEETING_TYPES.find(m => m.value === meetingType)?.icon || CalendarClock;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CalendarClock className="h-5 w-5 text-indigo-500" />
        <h3 className="text-lg font-semibold">Smart Meeting Scheduler</h3>
        <Badge variant="secondary" className="text-[10px]">AI-Powered</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Config */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Schedule a Meeting</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Contact</label>
              <Select value={selectedContact} onValueChange={setSelectedContact}>
                <SelectTrigger><SelectValue placeholder="Select contact..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific contact</SelectItem>
                  {contacts.slice(0, 50).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Meeting Type</label>
              <div className="grid grid-cols-2 gap-2">
                {MEETING_TYPES.map(mt => {
                  const Icon = mt.icon;
                  return (
                    <Button
                      key={mt.value}
                      variant={meetingType === mt.value ? "default" : "outline"}
                      size="sm"
                      className="justify-start text-xs"
                      onClick={() => setMeetingType(mt.value)}
                    >
                      <Icon className="h-3.5 w-3.5 mr-1.5" />{mt.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Timezone</label>
              <Input value={timezone} onChange={e => setTimezone(e.target.value)} placeholder="e.g., America/New_York" />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Additional Notes</label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g., Prefer morning slots, avoid Fridays..." rows={2} />
            </div>

            <Button onClick={findSlots} disabled={loading} className="w-full">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Finding Slots...</> : <><Sparkles className="h-4 w-4 mr-2" />Find Optimal Times</>}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4" />AI Suggested Slots</CardTitle></CardHeader>
          <CardContent>
            {slots.length > 0 ? (
              <div className="space-y-2">
                {slots.map((slot, i) => (
                  <div key={i} className="p-3 bg-muted/50 rounded-lg border border-border hover:border-primary/30 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <MeetingTypeIcon className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{slot.date} · {slot.time}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{slot.score}% match</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />{slot.duration}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{slot.reason}</p>
                    <Button size="sm" variant="outline" className="mt-2 text-xs w-full" onClick={() => toast.success(`Meeting scheduled: ${slot.date} at ${slot.time}`)}>
                      Schedule This Slot
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarClock className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">AI will suggest optimal meeting times</p>
                <p className="text-xs mt-1">Based on contact history, timezone & availability patterns</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Generated Agenda */}
      {agenda && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Sparkles className="h-4 w-4 text-yellow-500" />AI-Generated Agenda</CardTitle></CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-sm whitespace-pre-wrap bg-muted/30 rounded-lg p-4">{agenda}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
