import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, AlertTriangle } from "lucide-react";
import type { Property, Booking } from "@/lib/bookingStore";

interface AddBookingDialogProps {
  properties: Property[];
  onAdd: (booking: Omit<Booking, "id">) => { success: boolean; conflict?: Booking };
}

const AddBookingDialog = ({ properties, onAdd }: AddBookingDialogProps) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const checkIn = new Date(form.checkIn);
    const checkOut = new Date(form.checkOut);
    if (checkOut <= checkIn) {
      setError("Check-out must be after check-in");
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
      setError(`Double booking prevented! Conflicts with ${result.conflict?.guestName}'s reservation.`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary hover:opacity-90">
          <Plus className="w-4 h-4 mr-2" /> Add Booking
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Booking</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
          )}
          <div>
            <Label>Property</Label>
            <Select value={form.propertyName} onValueChange={(v) => setForm(f => ({ ...f, propertyName: v }))}>
              <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
              <SelectContent>
                {properties.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Guest Name</Label>
            <Input value={form.guestName} onChange={e => setForm(f => ({ ...f, guestName: e.target.value }))} required />
          </div>
          <div>
            <Label>Platform</Label>
            <Select value={form.platform} onValueChange={(v) => setForm(f => ({ ...f, platform: v as Booking["platform"] }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="airbnb">Airbnb</SelectItem>
                <SelectItem value="booking">Booking.com</SelectItem>
                <SelectItem value="vrbo">VRBO</SelectItem>
                <SelectItem value="direct">Direct</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Check-in</Label>
              <Input type="date" value={form.checkIn} onChange={e => setForm(f => ({ ...f, checkIn: e.target.value }))} required />
            </div>
            <div>
              <Label>Check-out</Label>
              <Input type="date" value={form.checkOut} onChange={e => setForm(f => ({ ...f, checkOut: e.target.value }))} required />
            </div>
          </div>
          <div>
            <Label>Nightly Rate ($)</Label>
            <Input type="number" value={form.nightlyRate} onChange={e => setForm(f => ({ ...f, nightlyRate: e.target.value }))} required />
          </div>
          <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90">Create Booking</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddBookingDialog;
