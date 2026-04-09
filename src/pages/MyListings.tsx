import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Edit, Trash2, Eye, EyeOff, Crown } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  "Consulting", "Development", "Design", "Marketing", "Finance",
  "Legal", "Healthcare", "Education", "Logistics", "Events",
  "Real Estate", "Fitness", "Travel", "Other"
];

interface ListingForm {
  title: string;
  description: string;
  price_min: string;
  price_max: string;
  category: string;
  location: string;
}

const emptyForm: ListingForm = { title: "", description: "", price_min: "", price_max: "", category: "", location: "" };

const MyListings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ListingForm>(emptyForm);

  useEffect(() => { if (user) fetchListings(); }, [user]);

  const fetchListings = async () => {
    const { data } = await supabase
      .from("service_listings")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    setListings(data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user || !form.title.trim()) return;

    const payload = {
      user_id: user.id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      price_min: form.price_min ? Number(form.price_min) : 0,
      price_max: form.price_max ? Number(form.price_max) : 0,
      category: form.category || null,
      industry: profile?.industry || "hospitality",
      location: form.location.trim() || null,
    };

    if (editingId) {
      const { error } = await supabase.from("service_listings").update(payload).eq("id", editingId);
      if (error) { toast.error("Update failed"); return; }
      toast.success("Listing updated!");
    } else {
      const { error } = await supabase.from("service_listings").insert(payload);
      if (error) { toast.error("Create failed"); return; }
      toast.success("Listing created!");
    }

    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    fetchListings();
  };

  const toggleStatus = async (id: string, current: string) => {
    const newStatus = current === "active" ? "paused" : "active";
    await supabase.from("service_listings").update({ status: newStatus }).eq("id", id);
    toast.success(`Listing ${newStatus}`);
    fetchListings();
  };

  const deleteListing = async (id: string) => {
    await supabase.from("service_listings").delete().eq("id", id);
    toast.success("Listing deleted");
    fetchListings();
  };

  const openEdit = (listing: any) => {
    setEditingId(listing.id);
    setForm({
      title: listing.title,
      description: listing.description || "",
      price_min: listing.price_min?.toString() || "",
      price_max: listing.price_max?.toString() || "",
      category: listing.category || "",
      location: listing.location || "",
    });
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/marketplace")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Logo size="lg" showName />
            <span className="text-lg font-bold text-foreground">My Listings</span>
          </div>
          <Button className="bg-gradient-primary text-primary-foreground" size="sm" onClick={() => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" /> New Listing
          </Button>
        </div>
      </header>

      <main className="container py-6 max-w-4xl space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <Card key={i} className="animate-pulse"><CardContent className="p-6 h-24" /></Card>)}
          </div>
        ) : listings.length === 0 ? (
          <Card className="py-16 text-center">
            <CardContent>
              <p className="text-muted-foreground text-lg">No listings yet</p>
              <Button className="mt-4 bg-gradient-primary" onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-1" /> Create Your First Listing
              </Button>
            </CardContent>
          </Card>
        ) : (
          listings.map(listing => (
            <Card key={listing.id} className={listing.is_featured ? "ring-2 ring-primary/50" : ""}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground truncate">{listing.title}</h3>
                    {listing.is_featured && (
                      <Badge className="bg-gradient-primary text-primary-foreground text-xs">
                        <Crown className="w-3 h-3 mr-1" /> Featured
                      </Badge>
                    )}
                    <Badge variant={listing.status === "active" ? "default" : "secondary"}>
                      {listing.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{listing.description || "No description"}</p>
                  <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                    {listing.category && <span>{listing.category}</span>}
                    {listing.location && <span>• {listing.location}</span>}
                    {listing.price_min > 0 && <span>• ${listing.price_min}{listing.price_max > 0 ? ` - $${listing.price_max}` : ""}</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => toggleStatus(listing.id, listing.status)}>
                    {listing.status === "active" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(listing)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteListing(listing.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Listing" : "Create New Listing"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Web Development Services" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe your service..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Min Price ($)</Label>
                <Input type="number" value={form.price_min} onChange={e => setForm(f => ({ ...f, price_min: e.target.value }))} />
              </div>
              <div>
                <Label>Max Price ($)</Label>
                <Input type="number" value={form.price_max} onChange={e => setForm(f => ({ ...f, price_max: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Location</Label>
              <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. New York, Remote" />
            </div>
            <Button className="w-full bg-gradient-primary" onClick={handleSave} disabled={!form.title.trim()}>
              {editingId ? "Update Listing" : "Create Listing"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyListings;
