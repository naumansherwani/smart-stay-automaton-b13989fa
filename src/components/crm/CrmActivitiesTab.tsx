import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Phone, Mail, Calendar, FileText, CheckSquare, Clock, Sparkles } from "lucide-react";
import { useCrmActivities, useCrmContacts } from "@/hooks/useCrm";
import { getCrmConfig } from "@/lib/crmConfig";
import type { IndustryType } from "@/lib/industryConfig";
import { format } from "date-fns";
import { toast } from "sonner";

interface Props { industry: IndustryType; }

const TYPE_ICONS: Record<string, React.ReactNode> = {
  call: <Phone className="h-4 w-4 text-green-500" />,
  email: <Mail className="h-4 w-4 text-blue-500" />,
  meeting: <Calendar className="h-4 w-4 text-purple-500" />,
  note: <FileText className="h-4 w-4 text-yellow-500" />,
  task: <CheckSquare className="h-4 w-4 text-orange-500" />,
};

export default function CrmActivitiesTab({ industry }: Props) {
  const config = getCrmConfig(industry);
  const { activities, loading, addActivity } = useCrmActivities();
  const { contacts } = useCrmContacts();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: "note", subject: "", description: "", contact_id: "", scheduled_at: "" });

  const handleAdd = async () => {
    if (!form.subject?.trim() && !form.description?.trim()) { toast.error("Subject or description required"); return; }
    const payload: any = { type: form.type, subject: form.subject, description: form.description };
    if (form.contact_id) payload.contact_id = form.contact_id;
    if (form.scheduled_at) payload.scheduled_at = form.scheduled_at;
    const res = await addActivity(payload);
    if (res?.error) toast.error("Failed to add activity");
    else { toast.success("Activity added"); setOpen(false); setForm({ type: "note", subject: "", description: "", contact_id: "", scheduled_at: "" }); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Activity Timeline</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Log Activity</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log Activity</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">📞 Call</SelectItem>
                    <SelectItem value="email">📧 Email</SelectItem>
                    <SelectItem value="meeting">📅 Meeting</SelectItem>
                    <SelectItem value="note">📝 Note</SelectItem>
                    <SelectItem value="task">✅ Task</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Subject</Label><Input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
              {contacts.length > 0 && (
                <div>
                  <Label>{config.contactLabel}</Label>
                  <Select value={form.contact_id} onValueChange={v => setForm(p => ({ ...p, contact_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Link..." /></SelectTrigger>
                    <SelectContent>{contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div><Label>Schedule (optional)</Label><Input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(p => ({ ...p, scheduled_at: e.target.value }))} /></div>
              <Button onClick={handleAdd} className="w-full">Log Activity</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : activities.length === 0 ? (
        <Card><CardContent className="text-center py-12">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No activities logged yet.</p>
        </CardContent></Card>
      ) : (
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-4">
            {activities.map(activity => (
              <div key={activity.id} className="relative pl-14">
                <div className="absolute left-4 top-3 h-5 w-5 rounded-full bg-background border-2 border-border flex items-center justify-center">
                  {TYPE_ICONS[activity.type] || <FileText className="h-3 w-3" />}
                </div>
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs capitalize">{activity.type}</Badge>
                      {activity.ai_generated && <Badge variant="secondary" className="text-xs"><Sparkles className="h-3 w-3 mr-1" />AI</Badge>}
                      <span className="text-xs text-muted-foreground ml-auto">{format(new Date(activity.created_at), "MMM d, h:mm a")}</span>
                    </div>
                    {activity.subject && <p className="text-sm font-medium">{activity.subject}</p>}
                    {activity.description && <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>}
                    {activity.scheduled_at && (
                      <p className="text-xs text-primary mt-1 flex items-center gap-1"><Calendar className="h-3 w-3" />Scheduled: {format(new Date(activity.scheduled_at), "MMM d, h:mm a")}</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
