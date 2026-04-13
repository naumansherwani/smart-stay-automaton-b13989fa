import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Shield, Zap, CalendarCheck, X, CheckCircle2, XCircle, Clock, Loader2, Users, Hotel, Compass, Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { IndustryConfig, IndustryType } from "@/lib/industryConfig";
import SmartEmptyState from "@/components/conversion/SmartEmptyState";
import FirstSuccessMessage from "@/components/conversion/FirstSuccessMessage";
import TicketModal, { isTicketIndustry } from "@/components/tickets/TicketModal";

interface BookingRow {
  id: string;
  guest_name: string;
  guest_email: string | null;
  guest_phone: string | null;
  resource_id: string;
  check_in: string;
  check_out: string;
  status: string;
  platform: string | null;
  nightly_rate: number | null;
  total_price: number | null;
  notes: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

interface Resource {
  id: string;
  name: string;
  business_type: string | null;
  minimum_stay: number | null;
  max_capacity: number | null;
  base_price: number | null;
}

interface BookingManagerProps {
  config: IndustryConfig;
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  confirmed: <CheckCircle2 className="w-3.5 h-3.5 text-success" />,
  pending: <Clock className="w-3.5 h-3.5 text-warning" />,
  cancelled: <XCircle className="w-3.5 h-3.5 text-destructive" />,
  completed: <CalendarCheck className="w-3.5 h-3.5 text-primary" />,
  "checked-in": <Hotel className="w-3.5 h-3.5 text-primary" />,
  "checked-out": <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" />,
  "in-progress": <Compass className="w-3.5 h-3.5 text-primary" />,
};

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-success/10 text-success border-success/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  completed: "bg-primary/10 text-primary border-primary/20",
  "checked-in": "bg-accent/10 text-accent-foreground border-accent/20",
  "checked-out": "bg-muted text-muted-foreground border-border",
  "in-progress": "bg-primary/10 text-primary border-primary/20",
};

const BookingManager = ({ config }: BookingManagerProps) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [successPopup, setSuccessPopup] = useState(false);
  const [lastBookingName, setLastBookingName] = useState("");
  const hadBookingsBefore = useRef(false);
  const [ticketBooking, setTicketBooking] = useState<BookingRow | null>(null);
  const showTickets = isTicketIndustry(config.id as IndustryType);
  const [form, setForm] = useState({
    guest_name: "",
    guest_email: "",
    guest_phone: "",
    resource_id: "",
    check_in: "",
    check_out: "",
    platform: "direct",
    nightly_rate: "",
    notes: "",
    group_size: "1",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    const [bRes, rRes] = await Promise.all([
      supabase.from("bookings").select("*").eq("user_id", user.id).order("check_in", { ascending: false }),
      supabase.from("resources").select("id, name, business_type, minimum_stay, max_capacity, base_price").eq("user_id", user.id).eq("is_active", true),
    ]);
    if (bRes.data) {
      setBookings(bRes.data as unknown as BookingRow[]);
      if (bRes.data.length > 0) hadBookingsBefore.current = true;
    }
    if (rRes.data) setResources(rRes.data as unknown as Resource[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("bookings-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings", filter: `user_id=eq.${user.id}` }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const selectedResource = resources.find(r => r.id === form.resource_id);
  const isTourBooking = selectedResource?.business_type === "tour";

  // Send reschedule/decline/reassign email
  const sendRescheduleEmail = async (params: {
    email: string;
    clientName: string;
    originalDate: string;
    newDate?: string;
    resourceName: string;
    newResourceName?: string;
    resolution: "reassigned" | "rescheduled" | "declined";
    bookingId?: string;
  }) => {
    try {
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "booking-reschedule",
          recipientEmail: params.email,
          idempotencyKey: `booking-reschedule-${params.bookingId || crypto.randomUUID()}`,
          templateData: {
            clientName: params.clientName,
            originalDate: params.originalDate,
            newDate: params.newDate,
            resourceName: params.resourceName,
            newResourceName: params.newResourceName,
            resolution: params.resolution,
            industry: config.id,
          },
        },
      });
    } catch (e) {
      console.error("Failed to send reschedule email:", e);
    }
  };

  // Send ticket confirmation email for Airlines/Railways/Events
  const sendTicketEmail = async (params: {
    email: string;
    passengerName: string;
    resourceName: string;
    departure: string;
    arrival: string;
    bookingRef: string;
    price?: number;
    bookingId: string;
  }) => {
    if (!showTickets) return;
    try {
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "ticket-confirmation",
          recipientEmail: params.email,
          idempotencyKey: `ticket-confirm-${params.bookingId}`,
          templateData: {
            passengerName: params.passengerName,
            resourceName: params.resourceName,
            departure: new Date(params.departure).toLocaleString(),
            arrival: new Date(params.arrival).toLocaleString(),
            bookingRef: params.bookingRef,
            price: params.price?.toString(),
            industry: config.id,
          },
        },
      });
    } catch (e) {
      console.error("Failed to send ticket email:", e);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.resource_id) return;
    setSubmitting(true);

    const checkIn = new Date(form.check_in);
    const checkOut = new Date(form.check_out);
    if (checkOut <= checkIn) {
      toast.error("End time must be after start time");
      setSubmitting(false);
      return;
    }

    // Client-side minimum stay check (fast feedback)
    if (!isTourBooking && selectedResource?.minimum_stay && selectedResource.minimum_stay > 1) {
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      if (nights < selectedResource.minimum_stay) {
        toast.error(`Minimum stay is ${selectedResource.minimum_stay} nights for ${selectedResource.name}`);
        setSubmitting(false);
        return;
      }
    }

    // Client-side group size check (fast feedback)
    if (isTourBooking && selectedResource?.max_capacity) {
      const groupSize = Number(form.group_size) || 1;
      if (groupSize > selectedResource.max_capacity) {
        toast.error(`Maximum group size is ${selectedResource.max_capacity} for ${selectedResource.name}`);
        setSubmitting(false);
        return;
      }
    }

    // === AI-Powered Server-Side Validation ===
    try {
      const { data: validation, error: valError } = await supabase.functions.invoke("validate-booking", {
        body: {
          resource_id: form.resource_id,
          check_in: form.check_in,
          check_out: form.check_out,
          group_size: Number(form.group_size) || 1,
          business_type: selectedResource?.business_type,
          guest_name: form.guest_name,
          guest_email: form.guest_email || undefined,
          industry: config.id,
        },
      });

      if (valError) {
        toast.error("Booking validation failed. Please try again.");
        setSubmitting(false);
        return;
      }

      // Handle auto-rescheduled (different date on same resource)
      if (validation.auto_rescheduled && validation.suggested_slot) {
        const newStart = validation.suggested_slot.start;
        const newEnd = validation.suggested_slot.end;
        const newCheckIn = new Date(newStart);
        const newCheckOut = new Date(newEnd);
        const diffMs = newCheckOut.getTime() - newCheckIn.getTime();
        const nights = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) || 1;
        const rate = Number(form.nightly_rate) || selectedResource?.base_price || 0;

        const metadata: Record<string, unknown> = {
          auto_rescheduled: true,
          original_check_in: form.check_in,
          original_check_out: form.check_out,
        };
        if (isTourBooking) {
          metadata.group_size = Number(form.group_size) || 1;
          metadata.booking_type = "tour";
        } else {
          metadata.booking_type = "stay";
        }

        const bookingId = crypto.randomUUID();
        const { error } = await supabase.from("bookings").insert({
          id: bookingId,
          user_id: user.id,
          resource_id: form.resource_id,
          guest_name: form.guest_name,
          guest_email: form.guest_email || null,
          guest_phone: form.guest_phone || null,
          check_in: newStart,
          check_out: newEnd,
          platform: form.platform,
          nightly_rate: rate,
          total_price: isTourBooking ? rate * (Number(form.group_size) || 1) : rate * nights,
          notes: form.notes || null,
          status: "confirmed" as const,
          metadata: metadata as Record<string, unknown>,
        } as any);

        if (error) {
          toast.error("Failed to create rescheduled booking");
        } else {
          toast.success(`🤖 AI Auto-Rescheduled to ${newCheckIn.toLocaleDateString()} due to conflict!`, { duration: 6000 });

          // Send confirmation email if guest email exists
          if (form.guest_email) {
            sendRescheduleEmail({
              email: form.guest_email,
              clientName: form.guest_name,
              originalDate: `${new Date(form.check_in).toLocaleDateString()} - ${new Date(form.check_out).toLocaleDateString()}`,
              newDate: `${newCheckIn.toLocaleDateString()} - ${newCheckOut.toLocaleDateString()}`,
              resourceName: selectedResource?.name || "",
              resolution: "rescheduled",
              bookingId,
            });
          }

          if (!hadBookingsBefore.current) {
            setLastBookingName(form.guest_name);
            setSuccessPopup(true);
            hadBookingsBefore.current = true;
          }
          setDialogOpen(false);
          setForm({ guest_name: "", guest_email: "", guest_phone: "", resource_id: "", check_in: "", check_out: "", platform: "direct", nightly_rate: "", notes: "", group_size: "1" });
        }
        setSubmitting(false);
        return;
      }

      if (!validation.allowed) {
        toast.error(`🛡️ AI Declined: ${validation.reason || "Selected time or resource is no longer available."}`, {
          duration: 6000,
          description: validation.conflicting_bookings?.length
            ? `Conflicts with: ${validation.conflicting_bookings.map((c: any) => c.guest_name).join(", ")}`
            : undefined,
        });

        // Send decline email if guest email exists
        if (form.guest_email) {
          sendRescheduleEmail({
            email: form.guest_email,
            clientName: form.guest_name,
            originalDate: `${new Date(form.check_in).toLocaleDateString()} - ${new Date(form.check_out).toLocaleDateString()}`,
            resourceName: selectedResource?.name || "",
            resolution: "declined",
          });
        }

        setSubmitting(false);
        return;
      }

      // Handle auto-reassignment (different resource, same dates)
      const finalResourceId = validation.auto_reassigned
        ? validation.reassigned_resource_id
        : form.resource_id;

      if (validation.auto_reassigned) {
        toast.info(`🤖 AI Auto-Reassigned to ${validation.reassigned_resource_name} (original was unavailable)`, {
          duration: 5000,
        });
      }

      const diffMs = checkOut.getTime() - checkIn.getTime();
      const nights = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) || 1;
      const rate = Number(form.nightly_rate) || selectedResource?.base_price || 0;

      const metadata: Record<string, unknown> = {};
      if (isTourBooking) {
        metadata.group_size = Number(form.group_size) || 1;
        metadata.booking_type = "tour";
      } else {
        metadata.booking_type = "stay";
      }
      if (validation.auto_reassigned) {
        metadata.auto_reassigned = true;
        metadata.original_resource_id = form.resource_id;
      }

      const bookingId = crypto.randomUUID();
      const { error } = await supabase.from("bookings").insert({
        id: bookingId,
        user_id: user.id,
        resource_id: finalResourceId,
        guest_name: form.guest_name,
        guest_email: form.guest_email || null,
        guest_phone: form.guest_phone || null,
        check_in: form.check_in,
        check_out: form.check_out,
        platform: form.platform,
        nightly_rate: rate,
        total_price: isTourBooking ? rate * (Number(form.group_size) || 1) : rate * nights,
        notes: form.notes || null,
        status: "confirmed" as const,
        metadata: metadata as Record<string, unknown>,
      } as any);

      if (error) {
        toast.error("Failed to create booking");
      } else {
        toast.success(`${config.bookingLabel} created successfully!`);

        // Send reassignment email if auto-reassigned and guest email exists
        if (validation.auto_reassigned && form.guest_email) {
          sendRescheduleEmail({
            email: form.guest_email,
            clientName: form.guest_name,
            originalDate: `${checkIn.toLocaleDateString()} - ${checkOut.toLocaleDateString()}`,
            newDate: `${checkIn.toLocaleDateString()} - ${checkOut.toLocaleDateString()}`,
            resourceName: selectedResource?.name || "",
            newResourceName: validation.reassigned_resource_name,
            resolution: "reassigned",
            bookingId,
          });
        }

        if (!hadBookingsBefore.current) {
          setLastBookingName(form.guest_name);
          setSuccessPopup(true);
          hadBookingsBefore.current = true;
        }
        setDialogOpen(false);
        setForm({ guest_name: "", guest_email: "", guest_phone: "", resource_id: "", check_in: "", check_out: "", platform: "direct", nightly_rate: "", notes: "", group_size: "1" });
      }
    } catch (err) {
      toast.error("Booking validation error. Please try again.");
    }
    setSubmitting(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) toast.error("Failed to update");
    else toast.success(`Status updated to ${status}`);
  };

  const cancelBooking = async (id: string) => {
    await updateStatus(id, "cancelled");
  };

  const filteredBookings = filter === "all" ? bookings : bookings.filter(b => b.status === filter);
  const getResourceName = (id: string) => resources.find(r => r.id === id)?.name || "Unknown";
  const getResourceType = (id: string) => resources.find(r => r.id === id)?.business_type || "hotel";

  if (loading) {
    return <Card><CardContent className="py-8 text-center text-muted-foreground">Loading bookings...</CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-foreground">{config.bookingLabelPlural}</h3>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({bookings.length})</SelectItem>
              {config.statuses.map(s => (
                <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" /> New {config.bookingLabel}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                New {config.bookingLabel}
                <Badge variant="secondary" className="bg-success/10 text-success text-xs">
                  <Shield className="w-3 h-3 mr-1" /> AI Guard Active
                </Badge>
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-2.5 flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary flex-shrink-0" />
                <p className="text-[11px] text-muted-foreground">
                  AI checks for overlaps, buffer violations, minimum stay, and capacity limits before confirming.
                </p>
              </div>

              <div>
                <Label>{config.resourceLabel}</Label>
                <Select value={form.resource_id} onValueChange={v => {
                  const res = resources.find(r => r.id === v);
                  setForm(f => ({
                    ...f,
                    resource_id: v,
                    nightly_rate: res?.base_price ? String(res.base_price) : f.nightly_rate,
                  }));
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${config.resourceLabel.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {resources.map(r => (
                      <SelectItem key={r.id} value={r.id}>
                        <div className="flex items-center gap-2">
                          {r.business_type === "tour" ? <Compass className="w-3 h-3" /> : <Hotel className="w-3 h-3" />}
                          {r.name}
                          {r.base_price ? ` · $${r.base_price}` : ""}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedResource?.minimum_stay && selectedResource.minimum_stay > 1 && !isTourBooking && (
                <div className="text-xs text-warning bg-warning/10 rounded-lg px-3 py-2 border border-warning/20">
                  ⚠️ Minimum stay: {selectedResource.minimum_stay} nights
                </div>
              )}

              <div>
                <Label>{isTourBooking ? "Guest / Group Leader Name" : config.clientLabel + " Name"}</Label>
                <Input value={form.guest_name} onChange={e => setForm(f => ({ ...f, guest_name: e.target.value }))} required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={form.guest_email} onChange={e => setForm(f => ({ ...f, guest_email: e.target.value }))} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={form.guest_phone} onChange={e => setForm(f => ({ ...f, guest_phone: e.target.value }))} />
                </div>
              </div>

              <div>
                <Label>Platform</Label>
                <Select value={form.platform} onValueChange={v => setForm(f => ({ ...f, platform: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {config.platforms.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{isTourBooking ? "Start Time" : "Check-in"}</Label>
                  <Input type="datetime-local" value={form.check_in} onChange={e => setForm(f => ({ ...f, check_in: e.target.value }))} required />
                </div>
                <div>
                  <Label>{isTourBooking ? "End Time" : "Check-out"}</Label>
                  <Input type="datetime-local" value={form.check_out} onChange={e => setForm(f => ({ ...f, check_out: e.target.value }))} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{isTourBooking ? "Price per Person ($)" : "Rate per Night ($)"}</Label>
                  <Input type="number" value={form.nightly_rate} onChange={e => setForm(f => ({ ...f, nightly_rate: e.target.value }))} />
                </div>
                {isTourBooking && (
                  <div>
                    <Label>Group Size</Label>
                    <Input
                      type="number"
                      min={1}
                      max={selectedResource?.max_capacity || 100}
                      value={form.group_size}
                      onChange={e => setForm(f => ({ ...f, group_size: e.target.value }))}
                    />
                  </div>
                )}
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
              </div>

              <Button type="submit" disabled={submitting} className="w-full bg-gradient-primary hover:opacity-90">
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Shield className="w-4 h-4 mr-2" />}
                Create {config.bookingLabel}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <SmartEmptyState
          icon={CalendarCheck}
          title={`No ${config.bookingLabelPlural.toLowerCase()} found`}
          description={`Create your first ${config.bookingLabel.toLowerCase()} and let AI handle the rest`}
          actionLabel={`New ${config.bookingLabel}`}
          onAction={() => setDialogOpen(true)}
          emotionalMessage="Automation saves time and increases revenue"
        />
      ) : (
        <div className="space-y-2">
          {filteredBookings.map(b => {
            const resType = getResourceType(b.resource_id);
            const isStayBooking = resType !== "tour";
            const groupSize = (b.metadata as Record<string, unknown>)?.group_size;
            return (
              <Card key={b.id} className="hover:bg-secondary/20 transition-colors">
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        {STATUS_ICONS[b.status] || <Clock className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">{b.guest_name}</p>
                          {groupSize && (
                            <Badge variant="outline" className="text-[10px]">
                              <Users className="w-2.5 h-2.5 mr-0.5" />{String(groupSize)} guests
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {getResourceName(b.resource_id)} • {b.platform}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {isStayBooking
                            ? `${new Date(b.check_in).toLocaleDateString()} – ${new Date(b.check_out).toLocaleDateString()}`
                            : `${new Date(b.check_in).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} – ${new Date(b.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                          }
                        </p>
                        {b.total_price != null && (
                          <p className="text-sm font-semibold text-primary">${b.total_price}</p>
                        )}
                      </div>
                      <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[b.status] || ""}`}>
                        {b.status}
                      </Badge>
                      {b.status !== "cancelled" && b.status !== "completed" && b.status !== "checked-out" && (
                        <div className="flex gap-1">
                          {b.status === "pending" && (
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-success" onClick={() => updateStatus(b.id, "confirmed")}>
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Confirm
                            </Button>
                          )}
                          {b.status === "confirmed" && isStayBooking && (
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-primary" onClick={() => updateStatus(b.id, "checked-in")}>
                              Check-in
                            </Button>
                          )}
                          {b.status === "checked-in" && (
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-primary" onClick={() => updateStatus(b.id, "checked-out")}>
                              Check-out
                            </Button>
                          )}
                          {b.status === "confirmed" && !isStayBooking && (
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-primary" onClick={() => updateStatus(b.id, "completed")}>
                              <CalendarCheck className="w-3 h-3 mr-1" /> Complete
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => cancelBooking(b.id)}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                      {showTickets && (b.status === "confirmed" || b.status === "completed" || b.status === "checked-in") && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => setTicketBooking(b)}
                        >
                          <Ticket className="w-3 h-3" /> Ticket
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* First booking celebration */}
      <FirstSuccessMessage
        open={successPopup}
        onClose={() => setSuccessPopup(false)}
        type="booking"
        itemName={lastBookingName}
      />

      {/* AI Ticket Modal — Airlines, Railways, Events only */}
      {showTickets && ticketBooking && (
        <TicketModal
          open={!!ticketBooking}
          onClose={() => setTicketBooking(null)}
          ticket={{
            id: ticketBooking.id,
            passengerName: ticketBooking.guest_name,
            email: ticketBooking.guest_email || undefined,
            resourceName: getResourceName(ticketBooking.resource_id),
            departure: ticketBooking.check_in,
            arrival: ticketBooking.check_out,
            status: ticketBooking.status,
            price: ticketBooking.total_price || undefined,
            platform: ticketBooking.platform || undefined,
            bookingRef: ticketBooking.id.slice(0, 8).toUpperCase(),
            industry: config.id as IndustryType,
            metadata: ticketBooking.metadata || undefined,
          }}
        />
      )}
    </div>
  );
};

export default BookingManager;
