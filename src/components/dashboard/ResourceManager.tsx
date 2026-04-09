import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit2, Trash2, MapPin, DollarSign, Users, Clock, Hotel, Home, Compass, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { IndustryConfig, IndustryType } from "@/lib/industryConfig";

interface Resource {
  id: string;
  name: string;
  location: string | null;
  base_price: number | null;
  max_capacity: number | null;
  turnaround_minutes: number | null;
  cleaning_cost: number | null;
  is_active: boolean | null;
  industry: string;
  business_type: string | null;
  minimum_stay: number | null;
}

interface ResourceManagerProps {
  config: IndustryConfig;
  industry: IndustryType;
}

const BUSINESS_TYPES = [
  { value: "hotel", label: "Hotel", icon: Hotel, description: "Hotel rooms with date-based bookings" },
  { value: "airbnb", label: "Airbnb / Rental", icon: Home, description: "Vacation rental properties" },
  { value: "tour", label: "Tour / Activity", icon: Compass, description: "Time-slot based tours and activities" },
  { value: "other", label: "Other", icon: Building2, description: "Custom resource type" },
];

const BUSINESS_TYPE_ICONS: Record<string, React.ElementType> = {
  hotel: Hotel,
  airbnb: Home,
  tour: Compass,
  other: Building2,
};

const ResourceManager = ({ config, industry }: ResourceManagerProps) => {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Resource | null>(null);
  const isTravel = industry === "hospitality";
  const [form, setForm] = useState({
    name: "",
    location: "",
    base_price: "",
    max_capacity: "1",
    turnaround_minutes: "60",
    cleaning_cost: "0",
    is_active: true,
    business_type: "hotel",
    minimum_stay: "1",
  });

  const fetchResources = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("resources")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setResources(data as unknown as Resource[]);
    setLoading(false);
  };

  useEffect(() => { fetchResources(); }, [user]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", location: "", base_price: "", max_capacity: "1", turnaround_minutes: "60", cleaning_cost: "0", is_active: true, business_type: "hotel", minimum_stay: "1" });
    setDialogOpen(true);
  };

  const openEdit = (r: Resource) => {
    setEditing(r);
    setForm({
      name: r.name,
      location: r.location || "",
      base_price: String(r.base_price || 0),
      max_capacity: String(r.max_capacity || 1),
      turnaround_minutes: String(r.turnaround_minutes || 60),
      cleaning_cost: String(r.cleaning_cost || 0),
      is_active: r.is_active ?? true,
      business_type: r.business_type || "hotel",
      minimum_stay: String(r.minimum_stay || 1),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const payload: Record<string, unknown> = {
      name: form.name,
      location: form.location || null,
      base_price: Number(form.base_price) || 0,
      max_capacity: Number(form.max_capacity) || 1,
      turnaround_minutes: Number(form.turnaround_minutes) || 60,
      cleaning_cost: Number(form.cleaning_cost) || 0,
      is_active: form.is_active,
      industry,
      user_id: user.id,
      business_type: form.business_type,
      minimum_stay: Number(form.minimum_stay) || 1,
    };

    if (editing) {
      const { error } = await supabase.from("resources").update(payload).eq("id", editing.id);
      if (error) { toast.error("Failed to update"); return; }
      toast.success(`${config.resourceLabel} updated!`);
    } else {
      const { error } = await supabase.from("resources").insert(payload);
      if (error) { toast.error("Failed to create"); return; }
      toast.success(`${config.resourceLabel} created!`);
    }
    setDialogOpen(false);
    fetchResources();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("resources").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success(`${config.resourceLabel} deleted`);
    fetchResources();
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("resources").update({ is_active: !active }).eq("id", id);
    fetchResources();
  };

  const isTour = form.business_type === "tour";
  const priceLabel = isTour ? "Price per Booking ($)" : "Price per Night ($)";
  const capacityLabel = isTour ? "Group Size (max)" : "Max Guests";
  const bufferLabel = isTour ? "Prep Time (min)" : "Turnaround (min)";
  const cleaningLabel = isTour ? "Setup Cost ($)" : "Cleaning Cost ($)";

  if (loading) {
    return <Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          {config.resourceLabelPlural} ({resources.length})
        </h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="bg-gradient-primary hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" /> Add {config.resourceLabel}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit" : "Add"} {config.resourceLabel}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Business Type Selector - only for travel/hospitality */}
              {isTravel && (
                <div>
                  <Label>Business Type</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    {BUSINESS_TYPES.map(bt => {
                      const Icon = bt.icon;
                      const selected = form.business_type === bt.value;
                      return (
                        <button
                          key={bt.value}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, business_type: bt.value }))}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all ${
                            selected
                              ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                              : "border-border hover:border-primary/30 hover:bg-secondary/30"
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                          <div>
                            <p className={`text-xs font-medium ${selected ? "text-foreground" : "text-muted-foreground"}`}>{bt.label}</p>
                            <p className="text-[10px] text-muted-foreground">{bt.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <div>
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                  placeholder={isTour ? "e.g. City Walking Tour" : "e.g. Deluxe Room 101"}
                />
              </div>
              <div>
                <Label>Location</Label>
                <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Downtown, Beach Area" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{priceLabel}</Label>
                  <Input type="number" value={form.base_price} onChange={e => setForm(f => ({ ...f, base_price: e.target.value }))} />
                </div>
                <div>
                  <Label>{capacityLabel}</Label>
                  <Input type="number" min={1} value={form.max_capacity} onChange={e => setForm(f => ({ ...f, max_capacity: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{bufferLabel}</Label>
                  <Input type="number" value={form.turnaround_minutes} onChange={e => setForm(f => ({ ...f, turnaround_minutes: e.target.value }))} />
                </div>
                <div>
                  <Label>{cleaningLabel}</Label>
                  <Input type="number" value={form.cleaning_cost} onChange={e => setForm(f => ({ ...f, cleaning_cost: e.target.value }))} />
                </div>
              </div>
              {/* Minimum Stay - for non-tour types */}
              {!isTour && isTravel && (
                <div>
                  <Label>Minimum Stay (nights)</Label>
                  <Input type="number" min={1} value={form.minimum_stay} onChange={e => setForm(f => ({ ...f, minimum_stay: e.target.value }))} />
                </div>
              )}
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
              </div>
              <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90">
                {editing ? "Update" : "Create"} {config.resourceLabel}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {resources.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No {config.resourceLabelPlural} Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first {config.resourceLabel.toLowerCase()} to start scheduling.
            </p>
            <Button onClick={openCreate} className="bg-gradient-primary hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" /> Add First {config.resourceLabel}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map(r => {
            const TypeIcon = BUSINESS_TYPE_ICONS[r.business_type || "hotel"] || Building2;
            const bt = BUSINESS_TYPES.find(b => b.value === r.business_type);
            const isResourceTour = r.business_type === "tour";
            return (
              <Card key={r.id} className={`${!r.is_active ? "opacity-60" : ""}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {isTravel && <TypeIcon className="w-4 h-4 text-primary" />}
                      <CardTitle className="text-sm font-semibold">{r.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isTravel && bt && (
                        <Badge variant="outline" className="text-[10px]">{bt.label}</Badge>
                      )}
                      <Badge variant={r.is_active ? "default" : "secondary"} className={`text-[10px] ${r.is_active ? "bg-success text-success-foreground" : ""}`}>
                        {r.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {r.location && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" /> {r.location}
                    </div>
                  )}
                  <div className="flex gap-3 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />${r.base_price}/{isResourceTour ? "booking" : "night"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />{r.max_capacity} {isResourceTour ? "group" : "guests"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />{r.turnaround_minutes}m buffer
                    </span>
                  </div>
                  {!isResourceTour && (r.minimum_stay || 1) > 1 && (
                    <div className="text-xs text-muted-foreground">
                      Min stay: {r.minimum_stay} nights
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(r)}>
                      <Edit2 className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toggleActive(r.id, r.is_active ?? true)}>
                      {r.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(r.id)}>
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

export default ResourceManager;
