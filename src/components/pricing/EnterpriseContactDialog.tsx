import { useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Building2, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { sendOwnerNotification } from "@/lib/ownerNotifications";
import { toast } from "sonner";

interface EnterpriseContactDialogProps {
  trigger: ReactNode;
}

const leadSchema = z.object({
  full_name: z.string().trim().min(2, "Full name is required").max(120),
  company_name: z.string().trim().min(2, "Company name is required").max(160),
  work_email: z.string().trim().email("Valid work email required").max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  industry: z.string().trim().max(80).optional().or(z.literal("")),
  team_size: z.string().trim().max(40).optional().or(z.literal("")),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  current_challenges: z.string().trim().max(2000).optional().or(z.literal("")),
  features_needed: z.string().trim().max(2000).optional().or(z.literal("")),
  preferred_contact_method: z.string().trim().max(40).optional().or(z.literal("")),
});

const initialState = {
  full_name: "",
  company_name: "",
  work_email: "",
  phone: "",
  industry: "",
  team_size: "",
  country: "",
  current_challenges: "",
  features_needed: "",
  preferred_contact_method: "Email",
};

export default function EnterpriseContactDialog({ trigger }: EnterpriseContactDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState(initialState);

  const update = (field: keyof typeof initialState, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = leadSchema.safeParse(form);
    if (!parsed.success) {
      const first = parsed.error.errors[0]?.message ?? "Please complete required fields";
      toast.error(first);
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...parsed.data,
        source: "Website Enterprise Pricing Page",
        status: "new",
        currency_context: "GBP",
      };
      const { error } = await supabase.from("enterprise_leads").insert([payload]);
      if (error) throw error;

      // Fire-and-forget owner notification
      sendOwnerNotification({
        eventType: "enterprise_lead",
        eventTitle: `🏢 New Enterprise Lead — ${parsed.data.company_name}`,
        details:
          `${parsed.data.full_name} from ${parsed.data.company_name} (${parsed.data.work_email}) ` +
          `submitted an enterprise inquiry.\n\n` +
          `Industry: ${parsed.data.industry || "—"}\n` +
          `Team size: ${parsed.data.team_size || "—"}\n` +
          `Country: ${parsed.data.country || "—"}\n` +
          `Phone: ${parsed.data.phone || "—"}\n` +
          `Preferred contact: ${parsed.data.preferred_contact_method || "—"}\n\n` +
          `Challenges: ${parsed.data.current_challenges || "—"}\n` +
          `Features needed: ${parsed.data.features_needed || "—"}`,
      });

      setSuccess(true);
    } catch (err: any) {
      console.error("Enterprise lead submission failed:", err);
      toast.error("Could not submit. Please try again or email us directly.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      // small reset delay so users see closing animation cleanly
      setTimeout(() => {
        setSuccess(false);
        setForm(initialState);
      }, 200);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40">
            <Building2 className="h-6 w-6 text-amber-400" />
          </div>
          <DialogTitle className="text-center text-xl">
            {success ? "Request Received" : "Talk to Enterprise Sales"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {success
              ? "Our Enterprise Team will be in touch shortly."
              : "Tailored pricing in GBP, dedicated onboarding and custom integrations. We respond within 1 business day."}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/40">
              <CheckCircle2 className="h-7 w-7 text-emerald-400" />
            </div>
            <p className="text-sm text-foreground leading-relaxed px-4">
              Thank you for contacting <span className="font-semibold">HostFlow AI Technologies</span>.
              <br />
              Our Enterprise Team has received your request and will contact you shortly.
            </p>
            <Button
              onClick={() => handleOpenChange(false)}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-95"
            >
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              Custom plan & volume pricing in GBP (£) · SSO · Dedicated onboarding
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ent-name">Full Name *</Label>
                <Input id="ent-name" value={form.full_name} onChange={(e) => update("full_name", e.target.value)} maxLength={120} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ent-company">Company Name *</Label>
                <Input id="ent-company" value={form.company_name} onChange={(e) => update("company_name", e.target.value)} maxLength={160} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ent-email">Work Email *</Label>
                <Input id="ent-email" type="email" value={form.work_email} onChange={(e) => update("work_email", e.target.value)} maxLength={255} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ent-phone">Phone Number</Label>
                <Input id="ent-phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} maxLength={40} placeholder="Optional" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ent-industry">Industry</Label>
                <Select value={form.industry} onValueChange={(v) => update("industry", v)}>
                  <SelectTrigger id="ent-industry"><SelectValue placeholder="Select industry" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hospitality">Hospitality</SelectItem>
                    <SelectItem value="Hotels">Hotels</SelectItem>
                    <SelectItem value="Short-Term Rentals">Short-Term Rentals</SelectItem>
                    <SelectItem value="Travel & Tourism">Travel & Tourism</SelectItem>
                    <SelectItem value="Events & Venues">Events & Venues</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Logistics">Logistics</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ent-team">Team Size</Label>
                <Select value={form.team_size} onValueChange={(v) => update("team_size", v)}>
                  <SelectTrigger id="ent-team"><SelectValue placeholder="Select size" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1–10</SelectItem>
                    <SelectItem value="11-50">11–50</SelectItem>
                    <SelectItem value="51-200">51–200</SelectItem>
                    <SelectItem value="201-500">201–500</SelectItem>
                    <SelectItem value="500+">500+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="ent-country">Country</Label>
                <Input id="ent-country" value={form.country} onChange={(e) => update("country", e.target.value)} maxLength={80} placeholder="e.g. United Kingdom" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="ent-challenges">Current Challenges</Label>
                <Textarea id="ent-challenges" rows={3} maxLength={2000} value={form.current_challenges} onChange={(e) => update("current_challenges", e.target.value)} placeholder="What's slowing your team down today?" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="ent-features">Features Needed</Label>
                <Textarea id="ent-features" rows={3} maxLength={2000} value={form.features_needed} onChange={(e) => update("features_needed", e.target.value)} placeholder="SSO, custom integrations, AI workflows…" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Preferred Contact Method</Label>
                <Select value={form.preferred_contact_method} onValueChange={(v) => update("preferred_contact_method", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="Phone">Phone</SelectItem>
                    <SelectItem value="Video Call">Video Call</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-95"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…</>
              ) : (
                "Submit Enterprise Inquiry"
              )}
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">
              We'll reply within 1 business day · All pricing in GBP (£)
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
