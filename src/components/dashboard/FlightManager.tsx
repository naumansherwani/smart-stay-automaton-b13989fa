import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Plus, Plane, Users, Clock, DollarSign, MapPin, Edit2,
  Trash2, AlertTriangle, CheckCircle2, XCircle, Search,
  ArrowRight, TrendingUp, Shield, Zap, Loader2, BarChart3,
  Calendar, RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { IndustryConfig } from "@/lib/industryConfig";
import { format } from "date-fns";

interface Flight {
  id: string;
  name: string; // flight number
  location: string | null; // route: "JFK → LAX"
  base_price: number | null;
  max_capacity: number | null;
  turnaround_minutes: number | null;
  is_active: boolean | null;
  metadata: Record<string, unknown> | null;
  business_type: string | null;
}

interface FlightBooking {
  id: string;
  guest_name: string;
  guest_email: string | null;
  resource_id: string;
  check_in: string;
  check_out: string;
  status: string;
  platform: string | null;
  total_price: number | null;
  nightly_rate: number | null;
  metadata: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
}

interface FlightManagerProps {
  config: IndustryConfig;
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-primary/10 text-primary border-primary/20",
  boarding: "bg-success/10 text-success border-success/20",
  departed: "bg-accent/10 text-accent-foreground border-accent/20",
  arrived: "bg-muted text-muted-foreground border-border",
  delayed: "bg-warning/10 text-warning border-warning/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  confirmed: "bg-success/10 text-success border-success/20",
  pending: "bg-warning/10 text-warning border-warning/20",
};

const FlightManager = ({ config }: FlightManagerProps) => {
  const { user } = useAuth();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [bookings, setBookings] = useState<FlightBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [flightDialogOpen, setFlightDialogOpen] = useState(false);
  const [bookDialogOpen, setBookDialogOpen] = useState(false);
  const [editingFlight, setEditingFlight] = useState<Flight | null>(null);
  const [selectedFlightForBook, setSelectedFlightForBook] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [submitting, setSubmitting] = useState(false);

  const [flightForm, setFlightForm] = useState({
    flight_number: "",
    origin: "",
    destination: "",
    departure: "",
    arrival: "",
    capacity: "180",
    base_price: "150",
    overbooking_enabled: false,
    overbooking_pct: "5",
  });

  const [bookForm, setBookForm] = useState({
    passenger_name: "",
    passenger_email: "",
    seats: "1",
    class: "economy",
    platform: "direct",
  });

  const fetchData = async () => {
    if (!user) return;
    const [fRes, bRes] = await Promise.all([
      supabase.from("resources").select("*").eq("user_id", user.id).eq("industry", "airlines").order("created_at", { ascending: false }),
      supabase.from("bookings").select("*").eq("user_id", user.id).order("check_in", { ascending: true }),
    ]);
    if (fRes.data) setFlights(fRes.data as unknown as Flight[]);
    if (bRes.data) setBookings(bRes.data as unknown as FlightBooking[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  useEffect(() => {
    if (!user) return;
    const ch1 = supabase.channel("flights-rt").on("postgres_changes", { event: "*", schema: "public", table: "resources", filter: `user_id=eq.${user.id}` }, () => fetchData()).subscribe();
    const ch2 = supabase.channel("flight-bookings-rt").on("postgres_changes", { event: "*", schema: "public", table: "bookings", filter: `user_id=eq.${user.id}` }, () => fetchData()).subscribe();
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); };
  }, [user]);

  const getBookingsForFlight = (flightId: string) =>
    bookings.filter(b => b.resource_id === flightId && b.status !== "cancelled");

  const getSeatsBooked = (flightId: string) => {
    return getBookingsForFlight(flightId).reduce((sum, b) => {
      const seats = (b.metadata as any)?.seats || 1;
      return sum + seats;
    }, 0);
  };

  const getLoadFactor = (flight: Flight) => {
    const booked = getSeatsBooked(flight.id);
    const capacity = flight.max_capacity || 1;
    return Math.round((booked / capacity) * 100);
  };

  const getAIPrice = (flight: Flight) => {
    const base = flight.base_price || 150;
    const load = getLoadFactor(flight);
    const meta = flight.metadata as Record<string, unknown> | null;
    const departure = meta?.departure_time ? new Date(meta.departure_time as string) : null;
    let multiplier = 1;

    // Demand-based
    if (load >= 90) multiplier += 0.4;
    else if (load >= 75) multiplier += 0.2;
    else if (load >= 50) multiplier += 0.05;
    else if (load < 30) multiplier -= 0.15;

    // Scarcity
    const remaining = (flight.max_capacity || 180) - getSeatsBooked(flight.id);
    if (remaining <= 10) multiplier += 0.3;
    else if (remaining <= 30) multiplier += 0.15;

    // Time to departure
    if (departure) {
      const hoursUntil = (departure.getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntil < 24) multiplier += 0.25;
      else if (hoursUntil < 72) multiplier += 0.1;
      else if (hoursUntil > 720) multiplier -= 0.1;
    }

    // Weekend premium
    if (departure) {
      const day = departure.getDay();
      if (day === 5 || day === 0) multiplier += 0.1;
    }

    return Math.round(base * multiplier);
  };

  // Flight CRUD
  const handleCreateFlight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    const route = `${flightForm.origin} → ${flightForm.destination}`;
    const metadata: Record<string, unknown> = {
      flight_type: "airline",
      origin: flightForm.origin,
      destination: flightForm.destination,
      departure_time: flightForm.departure,
      arrival_time: flightForm.arrival,
      overbooking_enabled: flightForm.overbooking_enabled,
      overbooking_pct: Number(flightForm.overbooking_pct) || 5,
    };

    const payload = {
      name: flightForm.flight_number,
      location: route,
      base_price: Number(flightForm.base_price) || 150,
      max_capacity: Number(flightForm.capacity) || 180,
      turnaround_minutes: 45,
      is_active: true,
      industry: "airlines" as const,
      user_id: user.id,
      business_type: "flight",
      metadata,
    };

    if (editingFlight) {
      const { error } = await supabase.from("resources").update(payload).eq("id", editingFlight.id);
      if (error) { toast.error("Failed to update flight"); setSubmitting(false); return; }
      toast.success("Flight updated!");
    } else {
      const { error } = await supabase.from("resources").insert(payload);
      if (error) { toast.error("Failed to create flight"); setSubmitting(false); return; }
      toast.success("Flight created!");
    }
    setFlightDialogOpen(false);
    setEditingFlight(null);
    resetFlightForm();
    setSubmitting(false);
  };

  const resetFlightForm = () => {
    setFlightForm({ flight_number: "", origin: "", destination: "", departure: "", arrival: "", capacity: "180", base_price: "150", overbooking_enabled: false, overbooking_pct: "5" });
  };

  const openEditFlight = (f: Flight) => {
    const meta = f.metadata as Record<string, unknown> || {};
    setEditingFlight(f);
    setFlightForm({
      flight_number: f.name,
      origin: (meta.origin as string) || "",
      destination: (meta.destination as string) || "",
      departure: (meta.departure_time as string) || "",
      arrival: (meta.arrival_time as string) || "",
      capacity: String(f.max_capacity || 180),
      base_price: String(f.base_price || 150),
      overbooking_enabled: (meta.overbooking_enabled as boolean) || false,
      overbooking_pct: String((meta.overbooking_pct as number) || 5),
    });
    setFlightDialogOpen(true);
  };

  const cancelFlight = async (id: string) => {
    await supabase.from("resources").update({ is_active: false }).eq("id", id);
    // Cancel all bookings for this flight
    await supabase.from("bookings").update({ status: "cancelled" }).eq("resource_id", id).neq("status", "cancelled");
    toast.success("Flight cancelled. All bookings have been cancelled.");
  };

  // Seat booking
  const handleBookSeat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedFlightForBook) return;
    setSubmitting(true);

    const flight = flights.find(f => f.id === selectedFlightForBook);
    if (!flight) { toast.error("Flight not found"); setSubmitting(false); return; }

    const meta = flight.metadata as Record<string, unknown> || {};
    const seats = Number(bookForm.seats) || 1;
    const booked = getSeatsBooked(flight.id);
    const capacity = flight.max_capacity || 180;
    const overbookingEnabled = (meta.overbooking_enabled as boolean) || false;
    const overbookingPct = (meta.overbooking_pct as number) || 5;
    const maxAllowed = overbookingEnabled ? Math.floor(capacity * (1 + overbookingPct / 100)) : capacity;

    if (booked + seats > maxAllowed) {
      const msg = overbookingEnabled
        ? `Flight is overbooked beyond ${overbookingPct}% limit. Only ${maxAllowed - booked} seats available.`
        : `Flight is fully booked. ${capacity - booked} seats remaining.`;
      toast.error(`🛡️ AI Declined: ${msg}`, { duration: 5000 });
      setSubmitting(false);
      return;
    }

    // Server-side validation
    try {
      const { data: validation, error: valError } = await supabase.functions.invoke("validate-booking", {
        body: {
          resource_id: selectedFlightForBook,
          check_in: meta.departure_time || new Date().toISOString(),
          check_out: meta.arrival_time || new Date().toISOString(),
          group_size: seats,
          business_type: "flight",
        },
      });

      if (valError || (validation && !validation.allowed)) {
        toast.error(`🛡️ AI Declined: ${validation?.reason || "Selected flight is no longer available."}`, { duration: 5000 });
        setSubmitting(false);
        return;
      }
    } catch {
      // Fallback to client-side validation (already done above)
    }

    const aiPrice = getAIPrice(flight);
    const classMultiplier = bookForm.class === "business" ? 2.5 : bookForm.class === "first" ? 4 : 1;
    const ticketPrice = Math.round(aiPrice * classMultiplier);

    const { error } = await supabase.from("bookings").insert({
      user_id: user.id,
      resource_id: selectedFlightForBook,
      guest_name: bookForm.passenger_name,
      guest_email: bookForm.passenger_email || null,
      check_in: (meta.departure_time as string) || new Date().toISOString(),
      check_out: (meta.arrival_time as string) || new Date().toISOString(),
      platform: bookForm.platform,
      nightly_rate: ticketPrice,
      total_price: ticketPrice * seats,
      status: "confirmed",
      metadata: {
        booking_type: "flight",
        seats,
        class: bookForm.class,
        flight_number: flight.name,
        route: flight.location,
        ai_price: aiPrice,
      },
    } as any);

    if (error) {
      toast.error("Failed to book seats");
    } else {
      toast.success(`${seats} seat${seats > 1 ? "s" : ""} booked on ${flight.name}!`);
      setBookDialogOpen(false);
      setBookForm({ passenger_name: "", passenger_email: "", seats: "1", class: "economy", platform: "direct" });
    }
    setSubmitting(false);
  };

  const updateBookingStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) toast.error("Failed to update");
    else toast.success(`Booking ${status}`);
  };

  // Filtered flights
  const filteredFlights = useMemo(() => {
    return flights.filter(f => {
      const matchSearch = !searchQuery ||
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.location || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [flights, searchQuery]);

  if (loading) {
    return <Card><CardContent className="py-8 text-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />Loading flights...</CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Plane className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Flights</p>
                <p className="text-xl font-bold text-foreground">{flights.filter(f => f.is_active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Passengers</p>
                <p className="text-xl font-bold text-foreground">
                  {bookings.filter(b => b.status !== "cancelled").reduce((s, b) => s + ((b.metadata as any)?.seats || 1), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Load</p>
                <p className="text-xl font-bold text-foreground">
                  {flights.length > 0 ? Math.round(flights.reduce((s, f) => s + getLoadFactor(f), 0) / flights.length) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-accent-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Revenue</p>
                <p className="text-xl font-bold text-foreground">
                  ${bookings.filter(b => b.status !== "cancelled").reduce((s, b) => s + (b.total_price || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search flights..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={bookDialogOpen} onOpenChange={setBookDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Users className="w-4 h-4 mr-2" /> Book Seats
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Book Passenger Seats
                  <Badge variant="secondary" className="bg-success/10 text-success text-xs">
                    <Shield className="w-3 h-3 mr-1" /> AI Guard
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleBookSeat} className="space-y-4">
                <div className="bg-primary/5 border border-primary/10 rounded-lg p-2.5 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary flex-shrink-0" />
                  <p className="text-[11px] text-muted-foreground">
                    AI checks seat availability, capacity limits, and overbooking rules before confirming.
                  </p>
                </div>
                <div>
                  <Label>Flight</Label>
                  <Select value={selectedFlightForBook} onValueChange={setSelectedFlightForBook}>
                    <SelectTrigger><SelectValue placeholder="Select flight" /></SelectTrigger>
                    <SelectContent>
                      {flights.filter(f => f.is_active).map(f => {
                        const load = getLoadFactor(f);
                        const booked = getSeatsBooked(f.id);
                        return (
                          <SelectItem key={f.id} value={f.id}>
                            <div className="flex items-center gap-2">
                              <Plane className="w-3 h-3" />
                              {f.name} · {f.location} · {booked}/{f.max_capacity} seats · ${getAIPrice(f)}
                              {load >= 90 && <Badge variant="outline" className="text-[9px] text-destructive">Almost Full</Badge>}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                {selectedFlightForBook && (() => {
                  const fl = flights.find(f => f.id === selectedFlightForBook);
                  if (!fl) return null;
                  const load = getLoadFactor(fl);
                  const remaining = (fl.max_capacity || 180) - getSeatsBooked(fl.id);
                  return (
                    <div className={`rounded-lg p-3 border ${load >= 90 ? "bg-destructive/5 border-destructive/20" : load >= 70 ? "bg-warning/5 border-warning/20" : "bg-success/5 border-success/20"}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">Seat Availability</span>
                        <span className="text-xs font-bold">{remaining} seats left</span>
                      </div>
                      <Progress value={load} className="h-2 mb-1" />
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>{load}% filled</span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-primary" />
                          AI Price: ${getAIPrice(fl)}
                        </span>
                      </div>
                    </div>
                  );
                })()}
                <div>
                  <Label>Passenger Name</Label>
                  <Input value={bookForm.passenger_name} onChange={e => setBookForm(f => ({ ...f, passenger_name: e.target.value }))} required />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={bookForm.passenger_email} onChange={e => setBookForm(f => ({ ...f, passenger_email: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Seats</Label>
                    <Input type="number" min={1} max={9} value={bookForm.seats} onChange={e => setBookForm(f => ({ ...f, seats: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Class</Label>
                    <Select value={bookForm.class} onValueChange={v => setBookForm(f => ({ ...f, class: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="economy">Economy</SelectItem>
                        <SelectItem value="business">Business (2.5×)</SelectItem>
                        <SelectItem value="first">First Class (4×)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Platform</Label>
                  <Select value={bookForm.platform} onValueChange={v => setBookForm(f => ({ ...f, platform: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {config.platforms.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {selectedFlightForBook && (() => {
                  const fl = flights.find(f => f.id === selectedFlightForBook);
                  if (!fl) return null;
                  const aiPrice = getAIPrice(fl);
                  const classM = bookForm.class === "business" ? 2.5 : bookForm.class === "first" ? 4 : 1;
                  const seats = Number(bookForm.seats) || 1;
                  return (
                    <div className="bg-secondary/50 rounded-lg p-3 border border-border">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Ticket Price (AI)</span>
                        <span className="font-bold text-foreground">${Math.round(aiPrice * classM)} × {seats}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1 pt-1 border-t border-border">
                        <span className="font-medium text-foreground">Total</span>
                        <span className="font-bold text-primary">${Math.round(aiPrice * classM * seats)}</span>
                      </div>
                    </div>
                  );
                })()}
                <Button type="submit" disabled={submitting} className="w-full bg-gradient-primary hover:opacity-90">
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Shield className="w-4 h-4 mr-2" />}
                  Book Seats
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={flightDialogOpen} onOpenChange={v => { setFlightDialogOpen(v); if (!v) { setEditingFlight(null); resetFlightForm(); } }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:opacity-90" size="sm">
                <Plus className="w-4 h-4 mr-2" /> Add Flight
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingFlight ? "Edit" : "Add"} Flight</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateFlight} className="space-y-4">
                <div>
                  <Label>Flight Number</Label>
                  <Input value={flightForm.flight_number} onChange={e => setFlightForm(f => ({ ...f, flight_number: e.target.value }))} required placeholder="e.g. AA1042" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Origin</Label>
                    <Input value={flightForm.origin} onChange={e => setFlightForm(f => ({ ...f, origin: e.target.value }))} required placeholder="JFK" />
                  </div>
                  <div>
                    <Label>Destination</Label>
                    <Input value={flightForm.destination} onChange={e => setFlightForm(f => ({ ...f, destination: e.target.value }))} required placeholder="LAX" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Departure</Label>
                    <Input type="datetime-local" value={flightForm.departure} onChange={e => setFlightForm(f => ({ ...f, departure: e.target.value }))} required />
                  </div>
                  <div>
                    <Label>Arrival</Label>
                    <Input type="datetime-local" value={flightForm.arrival} onChange={e => setFlightForm(f => ({ ...f, arrival: e.target.value }))} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Seats (Capacity)</Label>
                    <Input type="number" min={1} value={flightForm.capacity} onChange={e => setFlightForm(f => ({ ...f, capacity: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Base Ticket Price ($)</Label>
                    <Input type="number" value={flightForm.base_price} onChange={e => setFlightForm(f => ({ ...f, base_price: e.target.value }))} />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <Label className="cursor-pointer">Allow Overbooking</Label>
                    <p className="text-[11px] text-muted-foreground">Accept bookings beyond capacity limit</p>
                  </div>
                  <Switch checked={flightForm.overbooking_enabled} onCheckedChange={v => setFlightForm(f => ({ ...f, overbooking_enabled: v }))} />
                </div>
                {flightForm.overbooking_enabled && (
                  <div>
                    <Label>Overbooking Limit (%)</Label>
                    <Input type="number" min={1} max={20} value={flightForm.overbooking_pct} onChange={e => setFlightForm(f => ({ ...f, overbooking_pct: e.target.value }))} />
                  </div>
                )}
                <Button type="submit" disabled={submitting} className="w-full bg-gradient-primary hover:opacity-90">
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plane className="w-4 h-4 mr-2" />}
                  {editingFlight ? "Update" : "Create"} Flight
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Flight Cards */}
      {filteredFlights.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Plane className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Flights Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Add your first flight to start managing schedules and bookings.</p>
            <Button onClick={() => setFlightDialogOpen(true)} className="bg-gradient-primary hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" /> Add First Flight
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredFlights.map(flight => {
            const meta = flight.metadata as Record<string, unknown> || {};
            const load = getLoadFactor(flight);
            const booked = getSeatsBooked(flight.id);
            const remaining = (flight.max_capacity || 180) - booked;
            const aiPrice = getAIPrice(flight);
            const departure = meta.departure_time ? new Date(meta.departure_time as string) : null;
            const arrival = meta.arrival_time ? new Date(meta.arrival_time as string) : null;
            const overbookEnabled = (meta.overbooking_enabled as boolean) || false;

            return (
              <Card key={flight.id} className={`${!flight.is_active ? "opacity-50" : ""} hover:bg-secondary/20 transition-colors`}>
                <CardContent className="py-4 px-5">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    {/* Flight Info */}
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Plane className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-foreground">{flight.name}</h3>
                          {!flight.is_active && <Badge variant="destructive" className="text-[10px]">Cancelled</Badge>}
                          {overbookEnabled && <Badge variant="outline" className="text-[10px] text-warning border-warning/30">Overbooking ON</Badge>}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                          <MapPin className="w-3 h-3" />
                          <span>{flight.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Schedule */}
                    <div className="flex items-center gap-3">
                      {departure && (
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Depart</p>
                          <p className="text-sm font-semibold text-foreground">{format(departure, "HH:mm")}</p>
                          <p className="text-[10px] text-muted-foreground">{format(departure, "MMM d")}</p>
                        </div>
                      )}
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      {arrival && (
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Arrive</p>
                          <p className="text-sm font-semibold text-foreground">{format(arrival, "HH:mm")}</p>
                          <p className="text-[10px] text-muted-foreground">{format(arrival, "MMM d")}</p>
                        </div>
                      )}
                    </div>

                    {/* Capacity */}
                    <div className="w-32">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Load</span>
                        <span className={`font-bold ${load >= 90 ? "text-destructive" : load >= 70 ? "text-warning" : "text-success"}`}>
                          {load}%
                        </span>
                      </div>
                      <Progress value={Math.min(load, 100)} className="h-2" />
                      <p className="text-[10px] text-muted-foreground mt-0.5">{booked}/{flight.max_capacity} seats</p>
                    </div>

                    {/* AI Price */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-center px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/10">
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Zap className="w-3 h-3 text-primary" /> AI Price
                          </p>
                          <p className="text-lg font-bold text-foreground">${aiPrice}</p>
                          {aiPrice !== (flight.base_price || 150) && (
                            <p className={`text-[10px] ${aiPrice > (flight.base_price || 150) ? "text-success" : "text-destructive"}`}>
                              {aiPrice > (flight.base_price || 150) ? "+" : ""}
                              {Math.round(((aiPrice - (flight.base_price || 150)) / (flight.base_price || 150)) * 100)}% vs base
                            </p>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Base: ${flight.base_price} | Demand: {load}% | Remaining: {remaining} seats</p>
                      </TooltipContent>
                    </Tooltip>

                    {/* Actions */}
                    {flight.is_active && (
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => { setSelectedFlightForBook(flight.id); setBookDialogOpen(true); }}>
                          <Users className="w-3 h-3 mr-1" /> Book
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditFlight(flight)}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => cancelFlight(flight.id)}>
                          <XCircle className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Flight bookings summary */}
                  {getBookingsForFlight(flight.id).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">
                          Recent Bookings ({getBookingsForFlight(flight.id).length})
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {getBookingsForFlight(flight.id).slice(0, 5).map(b => (
                          <div key={b.id} className="flex items-center gap-1.5 px-2 py-1 rounded bg-secondary/50 text-xs">
                            <span className="font-medium text-foreground">{b.guest_name}</span>
                            <span className="text-muted-foreground">·</span>
                            <span className="text-muted-foreground">{(b.metadata as any)?.seats || 1} seat{((b.metadata as any)?.seats || 1) > 1 ? "s" : ""}</span>
                            <span className="text-muted-foreground">·</span>
                            <span className="text-primary font-medium">${b.total_price}</span>
                            <Badge variant="outline" className={`text-[9px] h-4 ${STATUS_COLORS[b.status] || ""}`}>{b.status}</Badge>
                            {b.status === "confirmed" && (
                              <button onClick={() => updateBookingStatus(b.id, "cancelled")} className="text-destructive hover:text-destructive/80">
                                <XCircle className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                        {getBookingsForFlight(flight.id).length > 5 && (
                          <span className="text-xs text-muted-foreground py-1">+{getBookingsForFlight(flight.id).length - 5} more</span>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FlightManager;
