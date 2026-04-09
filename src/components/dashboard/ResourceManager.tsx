import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit2, Trash2, MapPin, DollarSign, Users, Clock } from "lucide-react";
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
}

interface ResourceManagerProps {
  config: IndustryConfig;
  industry: IndustryType;
}

const ResourceManager = ({ config, industry }: ResourceManagerProps) => {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [form, setForm] = useState({
    name: "",
    location: "",
    base_price: "",
    max_capacity: "1",
    turnaround_minutes: "60",
    cleaning_cost: "0",
    is_active: true,
  });

  const fetchResources = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("resources")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setResources(data as Resource[]);
    setLoading(false);
  };

  useEffect(() => { fetchResources(); }, [user]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", location: "", base_price: "", max_capacity: "1", turnaround_minutes: "60", cleaning_cost: "0", is_active: true });
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
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const payload = {
      name: form.name,
      location: form.location || null,
      base_price: Number(form.base_price) || 0,
      max_capacity: Number(form.max_capacity) || 1,
      turnaround_minutes: Number(form.turnaround_minutes) || 60,
      cleaning_cost: Number(form.cleaning_cost) || 0,
      is_active: form.is_active,
      industry,
      user_id: user.id,
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
              <div>
                <Label>Name</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder={`e.g. ${config.resourceLabel} A`} />
              </div>
              <div>
                <Label>Location</Label>
                <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Optional location" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Base Price ($)</Label>
                  <Input type="number" value={form.base_price} onChange={e => setForm(f => ({ ...f, base_price: e.target.value }))} />
                </div>
                <div>
                  <Label>Max Capacity</Label>
                  <Input type="number" min={1} value={form.max_capacity} onChange={e => setForm(f => ({ ...f, max_capacity: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Turnaround (min)</Label>
                  <Input type="number" value={form.turnaround_minutes} onChange={e => setForm(f => ({ ...f, turnaround_minutes: e.target.value }))} />
                </div>
                <div>
                  <Label>Cleaning Cost ($)</Label>
                  <Input type="number" value={form.cleaning_cost} onChange={e => setForm(f => ({ ...f, cleaning_cost: e.target.value }))} />
                </div>
              </div>
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
          {resources.map(r => (
            <Card key={r.id} className={`${!r.is_active ? "opacity-60" : ""}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-semibold">{r.name}</CardTitle>
                  <Badge variant={r.is_active ? "default" : "secondary"} className={`text-[10px] ${r.is_active ? "bg-success text-success-foreground" : ""}`}>
                    {r.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {r.location && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" /> {r.location}
                  </div>
                )}
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />${r.base_price}/slot</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{r.max_capacity} cap</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.turnaround_minutes}m buffer</span>
                </div>
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
          ))}
        </div>
      )}
    </div>
  );
};

export default ResourceManager;
