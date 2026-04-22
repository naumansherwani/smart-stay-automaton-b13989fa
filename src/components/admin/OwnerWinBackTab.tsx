import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Heart, CheckCircle, XCircle, Volume2, Gift, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  discount_percent: number;
  duration_months: number;
  expiry_days: number;
  is_active: boolean;
}

interface Offer {
  id: string;
  user_id: string;
  language: string;
  voice_script: string | null;
  discount_code: string | null;
  status: string;
  created_at: string;
  expires_at: string | null;
  win_back_campaigns?: { name: string; discount_percent: number } | null;
}

export default function OwnerWinBackTab() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // New campaign form
  const [newName, setNewName] = useState("");
  const [newDiscount, setNewDiscount] = useState(30);
  const [newMonths, setNewMonths] = useState(3);
  const [newExpiry, setNewExpiry] = useState(7);

  const fetchData = async () => {
    setLoading(true);
    const [c, o] = await Promise.all([
      supabase.from("win_back_campaigns").select("*").order("created_at", { ascending: false }),
      supabase.from("win_back_offers")
        .select("*, win_back_campaigns(name, discount_percent)")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    setCampaigns((c.data as any) || []);
    setOffers((o.data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const createCampaign = async () => {
    if (!newName.trim()) return toast.error("Name required");
    const { error } = await supabase.from("win_back_campaigns").insert({
      name: newName, discount_percent: newDiscount,
      duration_months: newMonths, expiry_days: newExpiry, is_active: true,
    });
    if (error) return toast.error(error.message);
    toast.success("Campaign created");
    setNewName("");
    fetchData();
  };

  const toggleCampaign = async (id: string, isActive: boolean) => {
    await supabase.from("win_back_campaigns").update({ is_active: isActive }).eq("id", id);
    fetchData();
  };

  const handleOffer = async (offerId: string, action: "approve" | "reject") => {
    setActionLoading(offerId);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/winback-approve-offer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sess.session?.access_token}`,
          },
          body: JSON.stringify({ offerId, action }),
        }
      );
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Failed");
      toast.success(action === "approve" ? "Offer approved & sent" : "Offer rejected");
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const previewVoice = async (offer: Offer) => {
    if (!offer.voice_script) return toast.error("No script yet — approve first");
    try {
      const { data: sess } = await supabase.auth.getSession();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sess.session?.access_token}`,
          },
          body: JSON.stringify({ text: offer.voice_script, lang: offer.language, mode: "standard" }),
        }
      );
      const blob = await resp.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      audio.play();
    } catch {
      toast.error("Preview failed");
    }
  };

  const stats = {
    total: offers.length,
    pending: offers.filter(o => o.status === "pending").length,
    sent: offers.filter(o => ["approved","sent","viewed"].includes(o.status)).length,
    redeemed: offers.filter(o => o.status === "redeemed").length,
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-muted-foreground">Total Offers</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
          <div className="text-xs text-muted-foreground">Pending Approval</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-2xl font-bold text-blue-500">{stats.sent}</div>
          <div className="text-xs text-muted-foreground">Sent / Viewed</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-2xl font-bold text-green-500">{stats.redeemed}</div>
          <div className="text-xs text-muted-foreground">Redeemed</div>
        </CardContent></Card>
      </div>

      {/* Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Gift className="w-4 h-4" /> Win-Back Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 p-3 bg-muted/30 rounded-lg">
            <div className="md:col-span-2"><Label className="text-xs">Name</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Black Friday Win-Back" />
            </div>
            <div><Label className="text-xs">Discount %</Label>
              <Input type="number" value={newDiscount} onChange={e => setNewDiscount(+e.target.value)} />
            </div>
            <div><Label className="text-xs">Months</Label>
              <Input type="number" value={newMonths} onChange={e => setNewMonths(+e.target.value)} />
            </div>
            <div><Label className="text-xs">Expiry (days)</Label>
              <Input type="number" value={newExpiry} onChange={e => setNewExpiry(+e.target.value)} />
            </div>
            <Button onClick={createCampaign} className="md:col-span-5 gap-2">
              <Plus className="w-4 h-4" /> Create Campaign
            </Button>
          </div>

          <div className="space-y-2">
            {campaigns.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 border border-border/40 rounded-lg">
                <div>
                  <div className="font-medium text-sm">{c.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.discount_percent}% off · {c.duration_months}mo · expires in {c.expiry_days}d
                  </div>
                </div>
                <Switch checked={c.is_active} onCheckedChange={(v) => toggleCampaign(c.id, v)} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Offers Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Heart className="w-4 h-4" /> Recent Offers ({offers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (
            <div className="space-y-2">
              {offers.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">No offers yet</p>}
              {offers.map(o => (
                <div key={o.id} className="p-3 border border-border/40 rounded-lg space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px]">{o.language.toUpperCase()}</Badge>
                      <Badge className={`text-[10px] ${
                        o.status === "pending" ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300" :
                        o.status === "redeemed" ? "bg-green-500/20 text-green-700 dark:text-green-300" :
                        o.status === "rejected" ? "bg-red-500/20 text-red-700 dark:text-red-300" :
                        "bg-blue-500/20 text-blue-700 dark:text-blue-300"
                      }`}>{o.status}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {o.win_back_campaigns?.name} · {new Date(o.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {o.voice_script && (
                        <Button size="sm" variant="ghost" onClick={() => previewVoice(o)} className="h-7 w-7 p-0">
                          <Volume2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {o.status === "pending" && (
                        <>
                          <Button size="sm" variant="ghost" disabled={actionLoading === o.id}
                            onClick={() => handleOffer(o.id, "approve")}
                            className="h-7 w-7 p-0 text-green-500">
                            <CheckCircle className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" disabled={actionLoading === o.id}
                            onClick={() => handleOffer(o.id, "reject")}
                            className="h-7 w-7 p-0 text-red-500">
                            <XCircle className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  {o.voice_script && (
                    <p className="text-xs text-muted-foreground line-clamp-2 italic">"{o.voice_script}"</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}