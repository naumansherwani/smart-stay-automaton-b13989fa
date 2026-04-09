import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Edit2, Trash2, Car, MapPin, DollarSign, Clock, Wrench,
  Fuel, AlertTriangle, TrendingUp, Calendar, Shield, CheckCircle2,
  XCircle, BarChart3, Gauge, Battery, Thermometer, Settings2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { IndustryConfig } from "@/lib/industryConfig";

interface Vehicle {
  id: string;
  name: string;
  location: string | null;
  base_price: number | null;
  max_capacity: number | null;
  turnaround_minutes: number | null;
  cleaning_cost: number | null;
  is_active: boolean | null;
  business_type: string | null;
  minimum_stay: number | null;
  metadata: Record<string, unknown> | null;
}

interface VehicleManagerProps {
  config: IndustryConfig;
}

const VEHICLE_CATEGORIES = [
  { value: "economy", label: "Economy", icon: "🚗", description: "Compact & fuel-efficient" },
  { value: "sedan", label: "Sedan", icon: "🚙", description: "Mid-size comfort" },
  { value: "suv", label: "SUV", icon: "🚜", description: "Spacious & off-road capable" },
  { value: "luxury", label: "Luxury", icon: "🏎️", description: "Premium experience" },
  { value: "electric", label: "Electric", icon: "⚡", description: "Zero emissions" },
  { value: "van", label: "Van / Minibus", icon: "🚐", description: "Group transport" },
  { value: "truck", label: "Truck / Pickup", icon: "🛻", description: "Cargo & utility" },
  { value: "sports", label: "Sports Car", icon: "🏁", description: "High performance" },
];

const RENTAL_MODES = [
  { value: "hourly", label: "Hourly Rental" },
  { value: "daily", label: "Daily Rental" },
  { value: "weekly", label: "Weekly Rental" },
];

const VehicleManager = ({ config }: VehicleManagerProps) => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [form, setForm] = useState({
    name: "",
    location: "",
    base_price: "",
    max_capacity: "5",
    turnaround_minutes: "30",
    cleaning_cost: "25",
    is_active: true,
    business_type: "sedan",
    minimum_stay: "1",
    rental_mode: "daily",
    plate_number: "",
    mileage: "0",
    fuel_type: "petrol",
    year: new Date().getFullYear().toString(),
    color: "",
    insurance_included: true,
  });
  const [maintenanceForm, setMaintenanceForm] = useState({
    start: "",
    end: "",
    reason: "Scheduled Maintenance",
  });

  const fetchData = async () => {
    if (!user) return;
    const [vRes, bRes] = await Promise.all([
      supabase.from("resources").select("*").eq("user_id", user.id).eq("industry", "car_rental").order("created_at", { ascending: false }),
      supabase.from("bookings").select("id, resource_id, check_in, check_out, status, guest_name").eq("user_id", user.id),
    ]);
    if (vRes.data) setVehicles(vRes.data as unknown as Vehicle[]);
    if (bRes.data) setBookings(bRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  // Realtime updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("vehicle-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "resources", filter: `user_id=eq.${user.id}` }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings", filter: `user_id=eq.${user.id}` }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const getVehicleStatus = (v: Vehicle) => {
    if (!v.is_active) return "inactive";
    const now = new Date();
    const activeBooking = bookings.find(b =>
      b.resource_id === v.id &&
      b.status !== "cancelled" &&
      new Date(b.check_in) <= now &&
      new Date(b.check_out) >= now
    );
    if (activeBooking) return "rented";
    // Check maintenance blocks
    const meta = v.metadata as Record<string, unknown> | null;
    const maintenanceBlocks = (meta?.maintenance_blocks as any[]) || [];
    const inMaintenance = maintenanceBlocks.some((mb: any) =>
      new Date(mb.start) <= now && new Date(mb.end) >= now
    );
    if (inMaintenance) return "maintenance";
    // Check if overdue (past check_out but not returned)
    const overdueBooking = bookings.find(b =>
      b.resource_id === v.id &&
      b.status === "confirmed" &&
      new Date(b.check_out) < now
    );
    if (overdueBooking) return "overdue";
    return "available";
  };

  const getUtilization = (vehicleId: string) => {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const vBookings = bookings.filter(b =>
      b.resource_id === vehicleId &&
      b.status !== "cancelled" &&
      new Date(b.check_in) >= last30Days
    );
    const totalHours = vBookings.reduce((sum, b) => {
      const hours = (new Date(b.check_out).getTime() - new Date(b.check_in).getTime()) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);
    return Math.min(100, Math.round((totalHours / (30 * 24)) * 100));
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "", location: "", base_price: "", max_capacity: "5",
      turnaround_minutes: "30", cleaning_cost: "25", is_active: true,
      business_type: "sedan", minimum_stay: "1", rental_mode: "daily",
      plate_number: "", mileage: "0", fuel_type: "petrol",
      year: new Date().getFullYear().toString(), color: "", insurance_included: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (v: Vehicle) => {
    setEditing(v);
    const meta = v.metadata as Record<string, unknown> | null;
    setForm({
      name: v.name,
      location: v.location || "",
      base_price: String(v.base_price || 0),
      max_capacity: String(v.max_capacity || 5),
      turnaround_minutes: String(v.turnaround_minutes || 30),
      cleaning_cost: String(v.cleaning_cost || 25),
      is_active: v.is_active ?? true,
      business_type: v.business_type || "sedan",
      minimum_stay: String(v.minimum_stay || 1),
      rental_mode: (meta?.rental_mode as string) || "daily",
      plate_number: (meta?.plate_number as string) || "",
      mileage: String((meta?.mileage as number) || 0),
      fuel_type: (meta?.fuel_type as string) || "petrol",
      year: String((meta?.year as number) || new Date().getFullYear()),
      color: (meta?.color as string) || "",
      insurance_included: (meta?.insurance_included as boolean) ?? true,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const metadata: Record<string, unknown> = {
      rental_mode: form.rental_mode,
      plate_number: form.plate_number,
      mileage: Number(form.mileage) || 0,
      fuel_type: form.fuel_type,
      year: Number(form.year),
      color: form.color,
      insurance_included: form.insurance_included,
      maintenance_blocks: editing
        ? ((editing.metadata as any)?.maintenance_blocks || [])
        : [],
    };

    const payload = {
      name: form.name,
      location: form.location || null,
      base_price: Number(form.base_price) || 0,
      max_capacity: Number(form.max_capacity) || 5,
      turnaround_minutes: Number(form.turnaround_minutes) || 30,
      cleaning_cost: Number(form.cleaning_cost) || 25,
      is_active: form.is_active,
      industry: "car_rental" as const,
      user_id: user.id,
      business_type: form.business_type,
      minimum_stay: Number(form.minimum_stay) || 1,
      metadata,
    };

    if (editing) {
      const { error } = await supabase.from("resources").update(payload).eq("id", editing.id);
      if (error) { toast.error("Failed to update vehicle"); return; }
      toast.success("Vehicle updated!");
    } else {
      const { error } = await supabase.from("resources").insert(payload);
      if (error) { toast.error("Failed to add vehicle"); return; }
      toast.success("Vehicle added to fleet!");
    }
    setDialogOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("resources").delete().eq("id", id);
    if (error) { toast.error("Failed to remove vehicle"); return; }
    toast.success("Vehicle removed from fleet");
    fetchData();
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("resources").update({ is_active: !active }).eq("id", id);
    fetchData();
  };

  const addMaintenanceBlock = async () => {
    if (!selectedVehicle || !maintenanceForm.start || !maintenanceForm.end) return;
    const meta = (selectedVehicle.metadata as Record<string, unknown>) || {};
    const blocks = ((meta.maintenance_blocks as any[]) || []).concat({
      start: maintenanceForm.start,
      end: maintenanceForm.end,
      reason: maintenanceForm.reason,
      created_at: new Date().toISOString(),
    });
    await supabase.from("resources").update({
      metadata: { ...meta, maintenance_blocks: blocks },
    }).eq("id", selectedVehicle.id);
    toast.success("Maintenance block added");
    setMaintenanceDialogOpen(false);
    fetchData();
  };

  const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
    available: { color: "text-success", icon: <CheckCircle2 className="w-3.5 h-3.5 text-success" /> },
    rented: { color: "text-primary", icon: <Car className="w-3.5 h-3.5 text-primary" /> },
    maintenance: { color: "text-warning", icon: <Wrench className="w-3.5 h-3.5 text-warning" /> },
    overdue: { color: "text-destructive", icon: <AlertTriangle className="w-3.5 h-3.5 text-destructive" /> },
    inactive: { color: "text-muted-foreground", icon: <XCircle className="w-3.5 h-3.5 text-muted-foreground" /> },
  };

  // Fleet summary stats
  const fleetStats = {
    total: vehicles.length,
    available: vehicles.filter(v => getVehicleStatus(v) === "available").length,
    rented: vehicles.filter(v => getVehicleStatus(v) === "rented").length,
    maintenance: vehicles.filter(v => getVehicleStatus(v) === "maintenance").length,
    overdue: vehicles.filter(v => getVehicleStatus(v) === "overdue").length,
  };
  const utilizationRate = fleetStats.total > 0 ? Math.round((fleetStats.rented / fleetStats.total) * 100) : 0;

  // Category breakdown
  const categoryBreakdown = VEHICLE_CATEGORIES.map(cat => {
    const catVehicles = vehicles.filter(v => v.business_type === cat.value);
    const catRented = catVehicles.filter(v => getVehicleStatus(v) === "rented").length;
    return { ...cat, total: catVehicles.length, rented: catRented, rate: catVehicles.length > 0 ? Math.round((catRented / catVehicles.length) * 100) : 0 };
  }).filter(c => c.total > 0);

  const priceLabel = form.rental_mode === "hourly" ? "Price per Hour ($)" : form.rental_mode === "weekly" ? "Price per Week ($)" : "Price per Day ($)";

  if (loading) {
    return <Card><CardContent className="py-8 text-center text-muted-foreground">Loading fleet...</CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      {/* Fleet Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4 text-center">
            <Car className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{fleetStats.total}</p>
            <p className="text-[10px] text-muted-foreground">Total Fleet</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="w-5 h-5 text-success mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{fleetStats.available}</p>
            <p className="text-[10px] text-muted-foreground">Available</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{fleetStats.rented}</p>
            <p className="text-[10px] text-muted-foreground">Rented Out</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
          <CardContent className="p-4 text-center">
            <Wrench className="w-5 h-5 text-warning mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{fleetStats.maintenance}</p>
            <p className="text-[10px] text-muted-foreground">In Maintenance</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-5 h-5 text-destructive mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{fleetStats.overdue}</p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </CardContent>
        </Card>
      </div>

      {/* Utilization Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Fleet Utilization</span>
            </div>
            <span className="text-sm font-bold text-primary">{utilizationRate}%</span>
          </div>
          <Progress value={utilizationRate} className="h-3" />
          <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
            <span>{fleetStats.rented} rented / {fleetStats.total} total</span>
            <span>Target: 85%</span>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> Utilization by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {categoryBreakdown.map(c => (
              <div key={c.value} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground">{c.icon} {c.label}</span>
                  <span className="text-muted-foreground">{c.rented}/{c.total} ({c.rate}%)</span>
                </div>
                <Progress value={c.rate} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Vehicle List */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          Fleet Vehicles ({vehicles.length})
        </h3>
        <div className="flex gap-2">
          <Dialog open={maintenanceDialogOpen} onOpenChange={setMaintenanceDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-warning" /> Schedule Maintenance
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Vehicle</Label>
                  <Select value={selectedVehicle?.id || ""} onValueChange={v => setSelectedVehicle(vehicles.find(ve => ve.id === v) || null)}>
                    <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                    <SelectContent>
                      {vehicles.map(v => (
                        <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Start</Label>
                    <Input type="datetime-local" value={maintenanceForm.start} onChange={e => setMaintenanceForm(f => ({ ...f, start: e.target.value }))} />
                  </div>
                  <div>
                    <Label>End</Label>
                    <Input type="datetime-local" value={maintenanceForm.end} onChange={e => setMaintenanceForm(f => ({ ...f, end: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label>Reason</Label>
                  <Select value={maintenanceForm.reason} onValueChange={v => setMaintenanceForm(f => ({ ...f, reason: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Scheduled Maintenance">Scheduled Maintenance</SelectItem>
                      <SelectItem value="Oil Change">Oil Change</SelectItem>
                      <SelectItem value="Tire Replacement">Tire Replacement</SelectItem>
                      <SelectItem value="Body Repair">Body Repair</SelectItem>
                      <SelectItem value="Deep Cleaning">Deep Cleaning</SelectItem>
                      <SelectItem value="Insurance Inspection">Insurance Inspection</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={addMaintenanceBlock} className="w-full bg-gradient-primary">
                  <Wrench className="w-4 h-4 mr-2" /> Block for Maintenance
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={() => setMaintenanceDialogOpen(true)}>
            <Wrench className="w-4 h-4 mr-2" /> Maintenance
          </Button>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate} className="bg-gradient-primary hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" /> Add Vehicle
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit" : "Add"} Vehicle</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Category Selector */}
                <div>
                  <Label>Vehicle Category</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    {VEHICLE_CATEGORIES.map(cat => {
                      const selected = form.business_type === cat.value;
                      return (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, business_type: cat.value }))}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all ${
                            selected
                              ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                              : "border-border hover:border-primary/30 hover:bg-secondary/30"
                          }`}
                        >
                          <span className="text-lg">{cat.icon}</span>
                          <div>
                            <p className={`text-xs font-medium ${selected ? "text-foreground" : "text-muted-foreground"}`}>{cat.label}</p>
                            <p className="text-[10px] text-muted-foreground">{cat.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Vehicle Name / Model</Label>
                    <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Toyota Camry 2024" />
                  </div>
                  <div>
                    <Label>Plate Number</Label>
                    <Input value={form.plate_number} onChange={e => setForm(f => ({ ...f, plate_number: e.target.value }))} placeholder="e.g. ABC-1234" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Year</Label>
                    <Input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Color</Label>
                    <Input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} placeholder="e.g. White" />
                  </div>
                  <div>
                    <Label>Fuel Type</Label>
                    <Select value={form.fuel_type} onValueChange={v => setForm(f => ({ ...f, fuel_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="petrol">Petrol</SelectItem>
                        <SelectItem value="diesel">Diesel</SelectItem>
                        <SelectItem value="electric">Electric</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                        <SelectItem value="cng">CNG</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Location / Branch</Label>
                  <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Airport Branch, Downtown" />
                </div>

                <div>
                  <Label>Rental Mode</Label>
                  <Select value={form.rental_mode} onValueChange={v => setForm(f => ({ ...f, rental_mode: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {RENTAL_MODES.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{priceLabel}</Label>
                    <Input type="number" value={form.base_price} onChange={e => setForm(f => ({ ...f, base_price: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Passengers (max)</Label>
                    <Input type="number" min={1} value={form.max_capacity} onChange={e => setForm(f => ({ ...f, max_capacity: e.target.value }))} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Buffer Time (min)</Label>
                    <Input type="number" value={form.turnaround_minutes} onChange={e => setForm(f => ({ ...f, turnaround_minutes: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Cleaning Cost ($)</Label>
                    <Input type="number" value={form.cleaning_cost} onChange={e => setForm(f => ({ ...f, cleaning_cost: e.target.value }))} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Min Rental Duration ({form.rental_mode === "hourly" ? "hours" : "days"})</Label>
                    <Input type="number" min={1} value={form.minimum_stay} onChange={e => setForm(f => ({ ...f, minimum_stay: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Current Mileage</Label>
                    <Input type="number" value={form.mileage} onChange={e => setForm(f => ({ ...f, mileage: e.target.value }))} />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Insurance Included</Label>
                  <Switch checked={form.insurance_included} onCheckedChange={v => setForm(f => ({ ...f, insurance_included: v }))} />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Available for Rental</Label>
                  <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                </div>

                <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90">
                  {editing ? "Update" : "Add"} Vehicle
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {vehicles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Car className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Vehicles Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first vehicle to start managing your fleet.
            </p>
            <Button onClick={openCreate} className="bg-gradient-primary hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" /> Add First Vehicle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map(v => {
            const status = getVehicleStatus(v);
            const sc = statusConfig[status];
            const meta = v.metadata as Record<string, unknown> | null;
            const cat = VEHICLE_CATEGORIES.find(c => c.value === v.business_type);
            const utilization = getUtilization(v.id);
            const rentalMode = (meta?.rental_mode as string) || "daily";

            return (
              <Card key={v.id} className={`${!v.is_active ? "opacity-60" : ""} hover:shadow-md transition-shadow`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{cat?.icon || "🚗"}</span>
                      <div>
                        <CardTitle className="text-sm font-semibold">{v.name}</CardTitle>
                        {(meta?.plate_number as string) && (
                          <p className="text-[10px] text-muted-foreground font-mono">{meta?.plate_number as string}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px]">{cat?.label || "Car"}</Badge>
                      <div className="flex items-center gap-1">
                        {sc.icon}
                        <span className={`text-[10px] font-medium capitalize ${sc.color}`}>{status}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {v.location && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" /> {v.location}
                    </div>
                  )}
                  <div className="flex gap-3 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />${v.base_price}/{rentalMode === "hourly" ? "hr" : rentalMode === "weekly" ? "wk" : "day"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Car className="w-3 h-3" />{v.max_capacity} seats
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />{v.turnaround_minutes}m buffer
                    </span>
                  </div>
                  <div className="flex gap-2 text-xs text-muted-foreground flex-wrap">
                    {(meta?.fuel_type as string) && (
                      <span className="flex items-center gap-1">
                        <Fuel className="w-3 h-3" /> {(meta?.fuel_type as string)}
                      </span>
                    )}
                    {(meta?.year as number) && (
                      <span>{meta?.year as number}</span>
                    )}
                    {(meta?.color as string) && (
                      <span>{meta?.color as string}</span>
                    )}
                  </div>

                  {/* Utilization mini-bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>30-day utilization</span>
                      <span>{utilization}%</span>
                    </div>
                    <Progress value={utilization} className="h-1.5" />
                  </div>

                  {meta?.insurance_included && (
                    <Badge variant="outline" className="text-[10px] bg-success/5 text-success border-success/20">
                      <Shield className="w-2.5 h-2.5 mr-0.5" /> Insured
                    </Badge>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(v)}>
                      <Edit2 className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toggleActive(v.id, v.is_active ?? true)}>
                      {v.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(v.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VehicleManager;
