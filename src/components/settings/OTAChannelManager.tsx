import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Plug, Plus, Unplug, Globe2 } from "lucide-react";
import { toast } from "sonner";
import { REPLIT_URL, getAuthToken, getUserIndustry } from "@/lib/replitAuth";

interface OTAChannel {
  channel: string;
  name: string;
  logo?: string;
  industries?: string[];
  description?: string;
}

interface OTAConnection {
  channel: string;
  property_id: string;
  property_name: string;
  connected_at?: string;
  status?: string;
}

export default function OTAChannelManager() {
  const [channels, setChannels] = useState<OTAChannel[]>([]);
  const [connections, setConnections] = useState<OTAConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [industry, setIndustry] = useState<string>("general");
  const [busy, setBusy] = useState<string | null>(null);
  const [openFor, setOpenFor] = useState<OTAChannel | null>(null);
  const [propertyId, setPropertyId] = useState("");
  const [propertyName, setPropertyName] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const ind = await getUserIndustry();
      setIndustry(ind);

      const channelsRes = await fetch(`${REPLIT_URL}/api/profile/ota-connections/channels`);
      const channelsJson = channelsRes.ok ? await channelsRes.json() : { channels: [] };
      const allChannels: OTAChannel[] =
        channelsJson.channels || channelsJson.data?.channels || channelsJson.data || [];
      setChannels(allChannels);

      const token = await getAuthToken();
      if (token) {
        const myRes = await fetch(`${REPLIT_URL}/api/profile/ota-connections`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (myRes.ok) {
          const myJson = await myRes.json();
          const list: OTAConnection[] =
            myJson.connections || myJson.data?.connections || myJson.data || [];
          setConnections(Array.isArray(list) ? list : []);
        }
      }
    } catch (e) {
      console.error("OTA load failed", e);
      toast.error("Could not load OTA channels");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const isConnected = (ch: string) => connections.some((c) => c.channel === ch);
  const connectionFor = (ch: string) => connections.find((c) => c.channel === ch);

  const handleConnect = async () => {
    if (!openFor) return;
    if (!propertyId.trim() || !propertyName.trim()) {
      toast.error("Property ID and name are required");
      return;
    }
    setBusy(openFor.channel);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("Not signed in");
      const res = await fetch(`${REPLIT_URL}/api/profile/ota-connections`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel: openFor.channel,
          property_id: propertyId.trim(),
          property_name: propertyName.trim(),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success(`${openFor.name} connected`);
      setOpenFor(null);
      setPropertyId("");
      setPropertyName("");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Connect failed");
    } finally {
      setBusy(null);
    }
  };

  const handleDisconnect = async (channel: string) => {
    setBusy(channel);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("Not signed in");
      const res = await fetch(`${REPLIT_URL}/api/profile/ota-connections/${encodeURIComponent(channel)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success("Channel disconnected");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Disconnect failed");
    } finally {
      setBusy(null);
    }
  };

  const visible = channels.filter(
    (c) => !c.industries || c.industries.length === 0 || c.industries.includes(industry),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Globe2 className="w-4 h-4 text-primary" /> OTA Channel Manager
        </CardTitle>
        <CardDescription>
          Connect and sync inventory across distribution channels.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading channels…
          </div>
        ) : visible.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No channels available for your industry yet.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {visible.map((ch) => {
              const conn = connectionFor(ch.channel);
              const connected = !!conn;
              return (
                <div
                  key={ch.channel}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/30 border border-border/50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      {ch.logo ? (
                        <img src={ch.logo} alt={ch.name} className="w-7 h-7 object-contain" />
                      ) : (
                        <Plug className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{ch.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {connected ? conn?.property_name || conn?.property_id : ch.description || ch.channel}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {connected && (
                      <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30">
                        Connected
                      </Badge>
                    )}
                    {connected ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy === ch.channel}
                        onClick={() => handleDisconnect(ch.channel)}
                        className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                      >
                        {busy === ch.channel ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <Unplug className="w-3.5 h-3.5 mr-1" /> Disconnect
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={busy === ch.channel}
                        onClick={() => {
                          setOpenFor(ch);
                          setPropertyId("");
                          setPropertyName("");
                        }}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Connect
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Dialog open={!!openFor} onOpenChange={(o) => !o && setOpenFor(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect {openFor?.name}</DialogTitle>
              <DialogDescription>
                Enter your property identifier and display name to link this channel.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="ota-prop-id">Property ID</Label>
                <Input
                  id="ota-prop-id"
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  placeholder="12345678"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ota-prop-name">Property Name</Label>
                <Input
                  id="ota-prop-name"
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  placeholder="Pearl Continental Lahore"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpenFor(null)}>
                Cancel
              </Button>
              <Button onClick={handleConnect} disabled={busy === openFor?.channel}>
                {busy === openFor?.channel ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Connect"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}