import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Mail, Sparkles, Loader2, Copy, Send, RefreshCw, Wand2, Globe, Crown, Ticket, AlertTriangle } from "lucide-react";
import { useCrmContacts } from "@/hooks/useCrm";
import { supabase } from "@/integrations/supabase/client";
import { invokeShim } from "@/lib/replitApi";
import { toast } from "sonner";
import type { IndustryType } from "@/lib/industryConfig";

interface Props { industry: IndustryType; preselectedContactId?: string; }

const EMAIL_TONES = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "apologetic", label: "Apologetic" },
  { value: "urgent", label: "Urgent" },
  { value: "follow-up", label: "Follow-up" },
  { value: "promotional", label: "Promotional" },
  { value: "vip-exclusive", label: "VIP / Exclusive" },
  { value: "humble-premium", label: "Humble Premium" },
];

const EMAIL_TYPES = [
  { value: "welcome", label: "Welcome Email" },
  { value: "follow-up", label: "Follow-up" },
  { value: "proposal", label: "Proposal" },
  { value: "thank-you", label: "Thank You" },
  { value: "re-engagement", label: "Re-engagement" },
  { value: "upsell", label: "Upsell / Cross-sell" },
  { value: "delay-apology", label: "✈️ Flight Delay Apology" },
  { value: "lounge-pass", label: "🎫 Lounge Pass Offer" },
  { value: "loyalty-upgrade", label: "👑 Loyalty Upgrade" },
  { value: "custom", label: "Custom" },
];

const NATIONALITY_LANGUAGES: Record<string, { label: string; code: string }> = {
  auto: { label: "Auto-detect", code: "en" },
  en: { label: "English", code: "en" },
  ar: { label: "Arabic (العربية)", code: "ar" },
  ur: { label: "Urdu (اردو)", code: "ur" },
  hi: { label: "Hindi (हिन्दी)", code: "hi" },
  es: { label: "Spanish (Español)", code: "es" },
  fr: { label: "French (Français)", code: "fr" },
  de: { label: "German (Deutsch)", code: "de" },
  pt: { label: "Portuguese (Português)", code: "pt" },
  zh: { label: "Chinese (中文)", code: "zh" },
  ja: { label: "Japanese (日本語)", code: "ja" },
  ko: { label: "Korean (한국어)", code: "ko" },
  tr: { label: "Turkish (Türkçe)", code: "tr" },
};

function generateVoucherCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "FLY-";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function detectPassengerTier(contact: any): "vip" | "high-value" | "regular" {
  if (!contact) return "regular";
  if ((contact.total_revenue || 0) >= 10000 || (contact.total_bookings || 0) >= 20) return "vip";
  if ((contact.total_revenue || 0) >= 3000 || (contact.total_bookings || 0) >= 5) return "high-value";
  return "regular";
}

export default function CrmAiEmailComposer({ industry, preselectedContactId }: Props) {
  const { contacts } = useCrmContacts();
  const [selectedContact, setSelectedContact] = useState(preselectedContactId || "");
  const [emailType, setEmailType] = useState("follow-up");
  const [tone, setTone] = useState("professional");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [emailLang, setEmailLang] = useState("auto");
  const [includeVoucher, setIncludeVoucher] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherType, setVoucherType] = useState("discount");

  const selectedContactData = contacts.find(c => c.id === selectedContact);
  const passengerTier = detectPassengerTier(selectedContactData);
  const isAirline = industry === "airlines";

  // Auto-adjust tone for VIP
  useEffect(() => {
    if (passengerTier === "vip") setTone("vip-exclusive");
    else if (passengerTier === "high-value") setTone("humble-premium");
  }, [passengerTier]);

  // Auto-enable voucher for delay emails
  useEffect(() => {
    if (emailType === "delay-apology" || emailType === "lounge-pass") {
      setIncludeVoucher(true);
      setVoucherCode(generateVoucherCode());
      setVoucherType(emailType === "lounge-pass" ? "lounge_pass" : "discount");
    }
  }, [emailType]);

  const generateEmail = async () => {
    setLoading(true);
    try {
      const contact = selectedContactData;
      const voucher = includeVoucher ? { code: voucherCode || generateVoucherCode(), type: voucherType } : null;

      const { data, error } = await invokeShim("crm-ai-assistant", {
        body: {
          action: "compose_email",
          data: {
            industry,
            emailType,
            tone,
            customPrompt,
            language: emailLang !== "auto" ? emailLang : undefined,
            passengerTier,
            voucher,
            contact: contact ? {
              name: contact.name, email: contact.email, company: contact.company,
              lifecycle_stage: contact.lifecycle_stage, total_bookings: contact.total_bookings,
              total_revenue: contact.total_revenue, last_contacted_at: contact.last_contacted_at,
              tags: contact.tags,
            } : null,
          },
        },
      });
      if (error) throw error;
      setSubject(data?.subject || "Follow-up");
      setBody(data?.body || "Could not generate email.");
      setGenerated(true);
      toast.success("Email generated by AI!");
    } catch {
      toast.error("Failed to generate email");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    toast.success("Email copied to clipboard!");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Mail className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">AI Email Composer</h3>
        <Badge variant="secondary" className="text-[10px]">AI-Powered</Badge>
        {isAirline && <Badge className="text-[10px] bg-sky-500/10 text-sky-600 border-sky-500/20">Airlines Enhanced</Badge>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Configuration */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-primary" /> Configure Email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Contact Selection */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Select Contact (optional)</label>
              <Select value={selectedContact} onValueChange={setSelectedContact}>
                <SelectTrigger><SelectValue placeholder="Choose a contact..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific contact</SelectItem>
                  {contacts.slice(0, 50).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name} {c.email ? `(${c.email})` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Passenger Tier Badge */}
            {selectedContactData && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <Crown className={`h-4 w-4 ${passengerTier === "vip" ? "text-yellow-500" : passengerTier === "high-value" ? "text-blue-500" : "text-muted-foreground"}`} />
                <span className="text-xs font-medium capitalize">{passengerTier.replace("-", " ")} Passenger</span>
                {passengerTier === "vip" && <Badge className="text-[9px] bg-yellow-500/10 text-yellow-600 border-yellow-500/20">AI tone: Exclusive</Badge>}
                {passengerTier === "high-value" && <Badge className="text-[9px] bg-blue-500/10 text-blue-600 border-blue-500/20">AI tone: Premium</Badge>}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Email Type</label>
                <Select value={emailType} onValueChange={setEmailType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EMAIL_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Tone</label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EMAIL_TONES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Multi-language */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
                <Globe className="h-3 w-3" /> Email Language (by nationality)
              </label>
              <Select value={emailLang} onValueChange={setEmailLang}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(NATIONALITY_LANGUAGES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Voucher / Compensation */}
            {isAirline && (
              <div className="p-2.5 rounded-lg border border-dashed border-amber-500/30 bg-amber-500/5 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs flex items-center gap-1.5">
                    <Ticket className="h-3.5 w-3.5 text-amber-600" />
                    Auto-generate Voucher / Pass
                  </Label>
                  <Switch checked={includeVoucher} onCheckedChange={setIncludeVoucher} />
                </div>
                {includeVoucher && (
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={voucherType} onValueChange={setVoucherType}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="discount">Discount Code (15%)</SelectItem>
                        <SelectItem value="lounge_pass">Lounge Pass</SelectItem>
                        <SelectItem value="upgrade">Free Upgrade</SelectItem>
                        <SelectItem value="miles">Bonus Miles</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-1">
                      <Input value={voucherCode} onChange={e => setVoucherCode(e.target.value)} className="h-8 text-xs font-mono" placeholder="Code..." />
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setVoucherCode(generateVoucherCode())}>
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Custom Instructions (optional)</label>
              <Textarea
                placeholder="e.g., Mention our 20% discount on summer bookings..."
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                rows={3}
              />
            </div>

            <Button onClick={generateEmail} disabled={loading} className="w-full">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Email</>}
            </Button>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-500" /> Email Preview
              {emailLang !== "auto" && emailLang !== "en" && (
                <Badge variant="outline" className="text-[9px]">
                  <Globe className="h-2.5 w-2.5 mr-0.5" />{NATIONALITY_LANGUAGES[emailLang]?.label}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {generated ? (
              <>
                {includeVoucher && voucherCode && (
                  <div className="flex items-center gap-2 p-2 rounded bg-amber-500/10 border border-amber-500/20">
                    <Ticket className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-medium">Voucher included:</span>
                    <code className="text-xs font-mono bg-amber-500/20 px-1.5 py-0.5 rounded">{voucherCode}</code>
                    <Badge variant="outline" className="text-[9px] capitalize">{voucherType.replace("_", " ")}</Badge>
                  </div>
                )}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Subject</label>
                  <Input value={subject} onChange={e => setSubject(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Body</label>
                  <Textarea value={body} onChange={e => setBody(e.target.value)} rows={10} />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyToClipboard}>
                    <Copy className="h-4 w-4 mr-1" /> Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={generateEmail} disabled={loading}>
                    <RefreshCw className="h-4 w-4 mr-1" /> Regenerate
                  </Button>
                  <Button size="sm" className="ml-auto" onClick={() => toast.info("Email sending coming soon!")}>
                    <Send className="h-4 w-4 mr-1" /> Send
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Configure and generate an AI-powered email</p>
                <p className="text-xs mt-1">Select a contact, choose type & tone, then click Generate</p>
                {isAirline && (
                  <div className="mt-4 p-3 rounded-lg bg-muted/50 text-left space-y-1">
                    <p className="text-xs font-medium flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-amber-500" />Airlines Features:</p>
                    <p className="text-[11px]">• VIP/High-Value auto tone adjustment</p>
                    <p className="text-[11px]">• Auto voucher/lounge pass for delays</p>
                    <p className="text-[11px]">• Multi-language by passenger nationality</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
