import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Volume2, Loader2, Gift, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import i18n from "@/i18n";

interface WinBackOffer {
  id: string;
  language: string;
  voice_script: string | null;
  text_message: string | null;
  discount_code: string | null;
  expires_at: string | null;
  status: string;
  win_back_campaigns?: { name: string; discount_percent: number; duration_months: number } | null;
}

export default function WinBackOfferModal() {
  const { user } = useAuth();
  const [offer, setOffer] = useState<WinBackOffer | null>(null);
  const [open, setOpen] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioPlayed, setAudioPlayed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchOffer = async () => {
      const { data } = await supabase
        .from("win_back_offers")
        .select("*, win_back_campaigns(name, discount_percent, duration_months)")
        .eq("user_id", user.id)
        .in("status", ["approved", "sent"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && (!data.expires_at || new Date(data.expires_at) > new Date())) {
        setOffer(data as WinBackOffer);
        setOpen(true);
        // Mark as viewed
        await supabase.from("win_back_offers")
          .update({ status: "viewed", viewed_at: new Date().toISOString() })
          .eq("id", data.id);
      }
    };
    fetchOffer();
  }, [user]);

  const playVoice = useCallback(async () => {
    if (!offer?.voice_script || !user) return;
    setAudioLoading(true);
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
          body: JSON.stringify({
            text: offer.voice_script,
            lang: offer.language,
            mode: "standard",
          }),
        }
      );
      if (!resp.ok) throw new Error("TTS failed");
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      const startTime = Date.now();
      audio.onended = async () => {
        setAudioPlayed(true);
        const duration = Math.round((Date.now() - startTime) / 1000);
        await supabase.from("win_back_voice_log").insert({
          offer_id: offer.id,
          user_id: user.id,
          language: offer.language,
          duration_seconds: duration,
          completed: true,
        });
      };
      await audio.play();
    } catch (e) {
      console.error(e);
      toast.error("Voice playback failed");
    } finally {
      setAudioLoading(false);
    }
  }, [offer, user]);

  const copyCode = () => {
    if (!offer?.discount_code) return;
    navigator.clipboard.writeText(offer.discount_code);
    setCopied(true);
    toast.success("Code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const redeemOffer = async () => {
    if (!offer) return;
    await supabase.from("win_back_offers")
      .update({ status: "redeemed", redeemed_at: new Date().toISOString() })
      .eq("id", offer.id);
    toast.success("Offer claimed! Contact support to apply your discount.");
    setOpen(false);
  };

  if (!offer) return null;

  const camp = offer.win_back_campaigns;
  const discount = camp?.discount_percent || 30;
  const months = camp?.duration_months || 3;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 h-14 w-14 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
            <Heart className="h-7 w-7 text-white" />
          </div>
          <DialogTitle className="text-center text-2xl">We miss you! 💜</DialogTitle>
          <DialogDescription className="text-center">
            Personalized offer in {offer.language.toUpperCase()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {offer.text_message && (
            <div className="bg-muted/40 border border-border/40 rounded-xl p-4 text-sm leading-relaxed">
              {offer.text_message}
            </div>
          )}

          <Button
            onClick={playVoice}
            disabled={audioLoading}
            variant="outline"
            className="w-full gap-2"
          >
            {audioLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
            {audioPlayed ? "Play again" : "Listen in your language"}
          </Button>

          <div className="bg-gradient-to-br from-primary/10 to-pink-500/10 border border-primary/20 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">Your special discount</span>
            </div>
            <div className="text-3xl font-bold text-primary">{discount}% OFF</div>
            <p className="text-xs text-muted-foreground">For {months} months when you reactivate</p>

            {offer.discount_code && (
              <button
                onClick={copyCode}
                className="w-full mt-2 flex items-center justify-between gap-2 px-3 py-2 bg-background/60 border border-dashed border-primary/40 rounded-lg text-sm font-mono hover:bg-background transition"
              >
                <span>{offer.discount_code}</span>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
              </button>
            )}

            {offer.expires_at && (
              <Badge variant="secondary" className="text-[10px]">
                Expires {new Date(offer.expires_at).toLocaleDateString()}
              </Badge>
            )}
          </div>

          <Button onClick={redeemOffer} className="w-full bg-gradient-to-r from-primary to-pink-600">
            Claim my offer
          </Button>
          <button onClick={() => setOpen(false)} className="text-xs text-muted-foreground w-full text-center hover:underline">
            Maybe later
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}