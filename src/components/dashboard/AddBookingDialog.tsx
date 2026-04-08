import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, AlertTriangle, Shield, Zap } from "lucide-react";
import type { Property, Booking } from "@/lib/bookingStore";
import type { IndustryConfig } from "@/lib/industryConfig";

interface AddBookingDialogProps {
  properties: Property[];
  onAdd: (booking: Omit<Booking, "id">) => { success: boolean; conflict?: Booking };
  config?: IndustryConfig;
}

const AddBookingDialog = ({ properties, onAdd, config }: AddBookingDialogProps) => {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    propertyName: "",
    guestName: "",
    platform: "direct" as Booking["platform"],
    checkIn: "",
    checkOut: "",
    nightlyRate: "",
  });

  const bookingLabel = config?.bookingLabel || "Booking";
  const resourceLabel = config?.resourceLabel || "Property";
  const clientLabel = config?.clientLabel || "Guest";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const checkIn = new Date(form.checkIn);
    const checkOut = new Date(form.checkOut);
    if (checkOut <= checkIn) {
      setError("End time must be after start time");
      return;
    }
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const nightlyRate = Number(form.nightlyRate);

    const result = onAdd({
      propertyName: form.propertyName,
      guestName: form.guestName,
      platform: form.platform,
      checkIn,
      checkOut,
      nightlyRate,
      totalPrice: nightlyRate * nights,
      status: "confirmed",
    });

    if (result.success) {
      setOpen(false);
      setForm({ propertyName: "", guestName: "", platform: "direct", checkIn: "", checkOut: "", nightlyRate: "" });
    } else {
      setError(`🛡️ Double ${bookingLabel.toLowerCase()} prevented! Conflicts with ${result.conflict?.guestName}'s reservation. AI auto-declined this request.`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary hover:opacity-90">
          <Plus className="w-4 h-4 mr-2" /> Add {bookingLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            New {bookingLabel}
            <span className="inline-flex items-center text-xs font-normal text-success bg-success/10 px-2 py-0.5 rounded-full">
              <Shield className="w-3 h-3 mr-1" /> AI Guard Active
            </span>
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-destructive font-medium">{error}</p>
                <p className="text-xs text-destructive/70 mt-1">Try different dates or a different {resourceLabel.toLowerCase()}.</p>
              </div>
            </div>
          )}

          <div className="bg-primary/5 border border-primary/10 rounded-lg p-2.5 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary flex-shrink-0" />
            <p className="text-[11px] text-muted-foreground">
              AI will check for overlaps, turnaround violations, and capacity limits before confirming.
            </p>
          </div>

          <div>
            <Label>{resourceLabel}</Label>
            <Select value={form.propertyName} onValueChange={(v) => setForm(f => ({ ...f, propertyName: v }))}>
              <SelectTrigger><SelectValue placeholder={`Select ${resourceLabel.toLowerCase()}`} /></SelectTrigger>
              <SelectContent>
                {properties.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{clientLabel} Name</Label>
            <Input value={form.guestName} onChange={e => setForm(f => ({ ...f, guestName: e.target.value }))} required placeholder={`Enter ${clientLabel.toLowerCase()} name`} />
          </div>
          <div>
            <Label>Platform</Label>
            <Select value={form.platform} onValueChange={(v) => setForm(f => ({ ...f, platform: v as Booking["platform"] }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(config?.platforms || [
                  { value: "airbnb", label: "Airbnb" },
                  { value: "booking", label: "Booking.com" },
                  { value: "vrbo", label: "VRBO" },
                  { value: "direct", label: "Direct" },
                ]).map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start</Label>
              <Input type="date" value={form.checkIn} onChange={e => setForm(f => ({ ...f, checkIn: e.target.value }))} required />
            </div>
            <div>
              <Label>End</Label>
              <Input type="date" value={form.checkOut} onChange={e => setForm(f => ({ ...f, checkOut: e.target.value }))} required />
            </div>
          </div>
          <div>
            <Label>Rate ($)</Label>
            <Input type="number" value={form.nightlyRate} onChange={e => setForm(f => ({ ...f, nightlyRate: e.target.value }))} required />
          </div>
          <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90">
            <Shield className="w-4 h-4 mr-2" /> Create {bookingLabel}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddBookingDialog;
