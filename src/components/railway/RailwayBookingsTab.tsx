import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Ticket, Search, Eye, Trash2, Users, MapPin, ArrowRight } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-green-500/10 text-green-500 border-green-500/20",
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
  completed: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

const RailwayBookingsTab = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    schedule_id: "", from_station_id: "", to_station_id: "", coach_class: "economy",
    total_passengers: 1, contact_name: "", contact_email: "", contact_phone: "", notes: "",
  });

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["railway-bookings"],
    queryFn: async () => {
      const { data } = await supabase.from("railway_bookings")
        .select(`*, 
          from_station:railway_stations!railway_bookings_from_station_id_fkey(name, code),
          to_station:railway_stations!railway_bookings_to_station_id_fkey(name, code),
          railway_schedules(schedule_date, railway_routes(route_name, railway_trains(train_name)))
        `)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ["railway-schedules-for-booking"],
    queryFn: async () => {
      const { data } = await supabase.from("railway_schedules")
        .select("*, railway_routes(route_name, railway_trains(train_name))")
        .eq("status", "scheduled")
        .gte("schedule_date", new Date().toISOString().split("T")[0]);
      return data || [];
    },
  });

  const { data: stations = [] } = useQuery({
    queryKey: ["railway-stations"],
    queryFn: async () => {
      const { data } = await supabase.from("railway_stations").select("*").order("name");
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (booking: any) => {
      // Get stop sequences for from/to stations
      const schedule = schedules.find((s: any) => s.id === booking.schedule_id);
      if (!schedule) throw new Error("Schedule not found");
      
      const { data: stops } = await supabase.from("railway_route_stops")
        .select("station_id, stop_sequence")
        .eq("route_id", schedule.route_id)
        .order("stop_sequence");

      const fromStop = stops?.find(s => s.station_id === booking.from_station_id);
      const toStop = stops?.find(s => s.station_id === booking.to_station_id);

      if (!fromStop || !toStop) throw new Error("Stations not found on this route");
      if (fromStop.stop_sequence >= toStop.stop_sequence) throw new Error("Origin must be before destination");

      const { error } = await supabase.from("railway_bookings").insert({
        ...booking,
        user_id: user!.id,
        from_stop_sequence: fromStop.stop_sequence,
        to_stop_sequence: toStop.stop_sequence,
        base_price: 0,
        ai_price: 0,
        final_price: 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["railway-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["railway-bookings-count"] });
      setOpen(false);
      toast.success("Booking created successfully");
    },
    onError: (e) => toast.error(e.message),
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("railway_bookings").update({ status: "cancelled" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["railway-bookings"] });
      toast.success("Booking cancelled");
    },
  });

  const filtered = bookings.filter((b: any) =>
    b.booking_reference?.toLowerCase().includes(search.toLowerCase()) ||
    b.contact_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by reference or name..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> New Booking</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create Booking</DialogTitle></DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label>Schedule</Label>
                <Select value={form.schedule_id} onValueChange={v => setForm(f => ({ ...f, schedule_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select schedule" /></SelectTrigger>
                  <SelectContent>
                    {schedules.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.railway_routes?.train_name || s.railway_routes?.route_name} — {s.schedule_date}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From Station</Label>
                  <Select value={form.from_station_id} onValueChange={v => setForm(f => ({ ...f, from_station_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Origin" /></SelectTrigger>
                    <SelectContent>
                      {stations.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>To Station</Label>
                  <Select value={form.to_station_id} onValueChange={v => setForm(f => ({ ...f, to_station_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Destination" /></SelectTrigger>
                    <SelectContent>
                      {stations.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select value={form.coach_class} onValueChange={v => setForm(f => ({ ...f, coach_class: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["economy","business","sleeper","first_class"].map(c => <SelectItem key={c} value={c}>{c.replace("_"," ").toUpperCase()}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Passengers</Label>
                  <Input type="number" min={1} max={10} value={form.total_passengers} onChange={e => setForm(f => ({ ...f, total_passengers: parseInt(e.target.value) || 1 }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Contact Name</Label>
                <Input value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} />
                </div>
              </div>
              <Button onClick={() => {
                if (!form.schedule_id || !form.from_station_id || !form.to_station_id || !form.contact_name) return toast.error("Fill all required fields");
                addMutation.mutate(form);
              }} className="w-full" disabled={addMutation.isPending}>Create Booking</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Card key={i} className="animate-pulse h-20 bg-muted/50" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Ticket className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="font-semibold text-lg mb-1">No bookings yet</h3>
            <p className="text-sm text-muted-foreground">Create your first booking</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking: any) => (
            <Card key={booking.id} className="group hover:shadow-lg transition-all border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Ticket className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-foreground">{booking.booking_reference}</span>
                        <Badge className={`text-xs ${STATUS_COLORS[booking.status] || ""}`}>{booking.status}</Badge>
                        <Badge variant="outline" className="text-xs">{booking.coach_class?.replace("_"," ")}</Badge>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {booking.from_station?.name || "?"} 
                        <ArrowRight className="w-3 h-3" />
                        {booking.to_station?.name || "?"}
                        <span className="mx-1">•</span>
                        <Users className="w-3 h-3" /> {booking.total_passengers}
                        <span className="mx-1">•</span>
                        {booking.contact_name}
                        {booking.final_price > 0 && <><span className="mx-1">•</span><span className="font-semibold text-foreground">${booking.final_price}</span></>}
                      </div>
                    </div>
                  </div>
                  {booking.status === "confirmed" && (
                    <Button variant="ghost" size="sm" className="text-destructive text-xs" onClick={() => cancelMutation.mutate(booking.id)}>
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RailwayBookingsTab;
