import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Clock, AlertTriangle, CheckCircle, Brain } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  running: "bg-green-500/10 text-green-500 border-green-500/20",
  delayed: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
  completed: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

const RailwayScheduleTab = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);
  const [form, setForm] = useState({ route_id: "", schedule_date: new Date().toISOString().split("T")[0], status: "scheduled", delay_minutes: 0, notes: "" });

  const { data: routes = [] } = useQuery({
    queryKey: ["railway-routes"],
    queryFn: async () => {
      const { data } = await supabase.from("railway_routes").select("*, railway_trains(train_name, train_number)");
      return data || [];
    },
  });

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ["railway-schedules", dateFilter],
    queryFn: async () => {
      const { data } = await supabase.from("railway_schedules")
        .select("*, railway_routes(route_name, railway_trains(train_name, train_number))")
        .eq("schedule_date", dateFilter)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (sched: typeof form) => {
      const { error } = await supabase.from("railway_schedules").insert({ ...sched, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["railway-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["railway-schedules-today"] });
      setOpen(false);
      toast.success("Schedule created");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, delay_minutes }: { id: string; status: string; delay_minutes?: number }) => {
      const update: any = { status };
      if (delay_minutes !== undefined) update.delay_minutes = delay_minutes;
      const { error } = await supabase.from("railway_schedules").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["railway-schedules"] });
      toast.success("Schedule updated");
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-44" />
          <span className="text-sm text-muted-foreground">{schedules.length} schedules</span>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Add Schedule</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Schedule</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Route</Label>
                <Select value={form.route_id} onValueChange={v => setForm(f => ({ ...f, route_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select route" /></SelectTrigger>
                  <SelectContent>
                    {routes.map((r: any) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.route_name} — {r.railway_trains?.train_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={form.schedule_date} onChange={e => setForm(f => ({ ...f, schedule_date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Input placeholder="Any notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <Button onClick={() => {
                if (!form.route_id) return toast.error("Select a route");
                addMutation.mutate(form);
              }} className="w-full">Create Schedule</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Card key={i} className="animate-pulse h-20 bg-muted/50" />)}</div>
      ) : schedules.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="font-semibold text-lg mb-1">No schedules for this date</h3>
            <p className="text-sm text-muted-foreground">Create a schedule or pick another date</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {schedules.map((sched: any) => (
            <Card key={sched.id} className="hover:shadow-lg transition-all border-border/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{sched.railway_routes?.route_name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {sched.railway_routes?.railway_trains?.train_name} • {format(new Date(sched.schedule_date), "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {sched.delay_minutes > 0 && (
                    <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-xs">
                      <Clock className="w-3 h-3 mr-1" /> {sched.delay_minutes}min late
                    </Badge>
                  )}
                  <Badge className={`text-xs ${STATUS_COLORS[sched.status] || STATUS_COLORS.scheduled}`}>
                    {sched.status}
                  </Badge>
                  <Select value={sched.status} onValueChange={v => updateStatus.mutate({ id: sched.id, status: v })}>
                    <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.keys(STATUS_COLORS).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RailwayScheduleTab;
