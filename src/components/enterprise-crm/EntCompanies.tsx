import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Building2, Globe, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useEntCompanies } from "@/hooks/useEnterpriseCrm";

export default function EntCompanies() {
  const { data, refetch } = useEntCompanies();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", website: "", industry: "", country: "", team_size: "", annual_revenue_band: "", notes: "" });

  const save = async () => {
    if (!form.name.trim()) return toast.error("Company name required");
    const { error } = await supabase.from("ent_companies").insert(form);
    if (error) toast.error("Failed to add company");
    else { toast.success("Company added"); setForm({ name: "", website: "", industry: "", country: "", team_size: "", annual_revenue_band: "", notes: "" }); setOpen(false); refetch(); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this company?")) return;
    const { error } = await supabase.from("ent_companies").delete().eq("id", id);
    if (error) toast.error("Delete failed"); else { toast.success("Removed"); refetch(); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{data.length} enterprise companies tracked</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Company</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New Enterprise Company</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Company name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input placeholder="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Industry" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
                <Input placeholder="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
                <Input placeholder="Team size" value={form.team_size} onChange={(e) => setForm({ ...form, team_size: e.target.value })} />
                <Input placeholder="Revenue band (GBP)" value={form.annual_revenue_band} onChange={(e) => setForm({ ...form, annual_revenue_band: e.target.value })} />
              </div>
              <Textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
            </div>
            <DialogFooter><Button onClick={save}>Save Company</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {data.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-sm text-muted-foreground">No companies yet. Add your first enterprise prospect.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.map((c) => (
            <Card key={c.id} className="hover:border-primary/40 transition">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    <h4 className="font-semibold text-sm">{c.name}</h4>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(c.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
                {c.website && (
                  <a href={c.website.startsWith("http") ? c.website : `https://${c.website}`} target="_blank" rel="noreferrer" className="text-xs text-primary flex items-center gap-1 hover:underline">
                    <Globe className="w-3 h-3" /> {c.website}
                  </a>
                )}
                <div className="flex flex-wrap gap-1">
                  {c.industry && <Badge variant="outline" className="text-[10px]">{c.industry}</Badge>}
                  {c.country && <Badge variant="outline" className="text-[10px]">{c.country}</Badge>}
                  {c.team_size && <Badge variant="outline" className="text-[10px]">{c.team_size} ppl</Badge>}
                  {c.annual_revenue_band && <Badge variant="outline" className="text-[10px]">{c.annual_revenue_band}</Badge>}
                </div>
                {c.notes && <p className="text-xs text-muted-foreground line-clamp-3">{c.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}