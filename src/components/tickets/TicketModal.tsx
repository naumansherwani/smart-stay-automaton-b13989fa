import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Plane, TrainFront, Theater, Clock, MapPin, User, Hash, Calendar } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { IndustryType } from "@/lib/industryConfig";

interface TicketData {
  id: string;
  passengerName: string;
  email?: string;
  resourceName: string;
  departure: string;
  arrival: string;
  status: string;
  price?: number;
  platform?: string;
  bookingRef: string;
  industry: IndustryType;
  metadata?: Record<string, unknown>;
}

interface TicketModalProps {
  open: boolean;
  onClose: () => void;
  ticket: TicketData;
}

const TICKET_INDUSTRIES = new Set<IndustryType>(["airlines", "railways", "events_entertainment"]);

export function isTicketIndustry(industry: IndustryType): boolean {
  return TICKET_INDUSTRIES.has(industry);
}

function getIndustryLabel(industry: IndustryType) {
  switch (industry) {
    case "airlines": return { icon: Plane, label: "BOARDING PASS", color: "hsl(217,91%,60%)", bg: "hsl(217,91%,60%,0.08)", accent: "hsl(217,91%,60%)" };
    case "railways": return { icon: TrainFront, label: "TRAIN TICKET", color: "hsl(38,92%,55%)", bg: "hsl(38,92%,55%,0.08)", accent: "hsl(38,92%,55%)" };
    case "events_entertainment": return { icon: Theater, label: "EVENT TICKET", color: "hsl(270,80%,65%)", bg: "hsl(270,80%,65%,0.08)", accent: "hsl(270,80%,65%)" };
    default: return { icon: Hash, label: "TICKET", color: "hsl(174,62%,50%)", bg: "hsl(174,62%,50%,0.08)", accent: "hsl(174,62%,50%)" };
  }
}

function getTerminology(industry: IndustryType) {
  switch (industry) {
    case "airlines": return { from: "Departure", to: "Arrival", passenger: "Passenger", resource: "Flight", dateLabel: "Flight Date" };
    case "railways": return { from: "Boarding", to: "Destination", passenger: "Passenger", resource: "Train", dateLabel: "Travel Date" };
    case "events_entertainment": return { from: "Doors Open", to: "Event Ends", passenger: "Attendee", resource: "Event", dateLabel: "Event Date" };
    default: return { from: "Start", to: "End", passenger: "Guest", resource: "Booking", dateLabel: "Date" };
  }
}

const TicketModal = ({ open, onClose, ticket }: TicketModalProps) => {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [printing, setPrinting] = useState(false);
  const info = getIndustryLabel(ticket.industry);
  const terms = getTerminology(ticket.industry);
  const Icon = info.icon;

  const departureDate = new Date(ticket.departure);
  const arrivalDate = new Date(ticket.arrival);
  const qrValue = `HOSTFLOW-${ticket.bookingRef}-${ticket.id.slice(0, 8)}`;

  const handleDownload = () => {
    setPrinting(true);
    // Create a print-friendly version
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setPrinting(false);
      return;
    }

    const ticketHTML = `
<!DOCTYPE html>
<html>
<head>
<title>${info.label} - ${ticket.bookingRef}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; }
  .ticket { background: white; border-radius: 16px; overflow: hidden; width: 100%; max-width: 480px; box-shadow: 0 4px 24px rgba(0,0,0,0.12); }
  .ticket-header { background: linear-gradient(135deg, ${info.color}, ${info.accent}); color: white; padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; }
  .ticket-header h2 { font-size: 14px; letter-spacing: 3px; font-weight: 700; }
  .ticket-header .ref { font-size: 11px; opacity: 0.8; }
  .ticket-body { padding: 24px; }
  .passenger { font-size: 22px; font-weight: 800; color: #1a1a1a; margin-bottom: 4px; }
  .passenger-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px; }
  .route { display: flex; justify-content: space-between; align-items: center; margin: 20px 0; padding: 16px 0; border-top: 1px dashed #e0e0e0; border-bottom: 1px dashed #e0e0e0; }
  .route-point { text-align: center; flex: 1; }
  .route-point .time { font-size: 20px; font-weight: 700; color: #1a1a1a; }
  .route-point .date { font-size: 11px; color: #888; margin-top: 2px; }
  .route-point .label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .route-arrow { font-size: 20px; color: ${info.color}; padding: 0 8px; }
  .details { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0; }
  .detail-item .label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 1px; }
  .detail-item .value { font-size: 13px; font-weight: 600; color: #1a1a1a; margin-top: 2px; }
  .ticket-footer { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; background: #fafafa; border-top: 1px dashed #e0e0e0; }
  .ticket-footer .brand { font-size: 11px; color: #aaa; font-weight: 600; }
  .qr-section { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .qr-label { font-size: 9px; color: #aaa; text-transform: uppercase; letter-spacing: 1px; }
  .status-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; background: ${info.color}20; color: ${info.color}; }
  @media print { body { background: white; } .ticket { box-shadow: none; } }
</style>
</head>
<body>
<div class="ticket">
  <div class="ticket-header">
    <div>
      <h2>${info.label}</h2>
      <div class="ref">REF: ${ticket.bookingRef}</div>
    </div>
    <span class="status-badge">${ticket.status}</span>
  </div>
  <div class="ticket-body">
    <div class="passenger-label">${terms.passenger}</div>
    <div class="passenger">${ticket.passengerName}</div>
    
    <div class="route">
      <div class="route-point">
        <div class="label">${terms.from}</div>
        <div class="time">${departureDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        <div class="date">${departureDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</div>
      </div>
      <div class="route-arrow">→</div>
      <div class="route-point">
        <div class="label">${terms.to}</div>
        <div class="time">${arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        <div class="date">${arrivalDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</div>
      </div>
    </div>
    
    <div class="details">
      <div class="detail-item">
        <div class="label">${terms.resource}</div>
        <div class="value">${ticket.resourceName}</div>
      </div>
      <div class="detail-item">
        <div class="label">Platform</div>
        <div class="value">${ticket.platform || 'Direct'}</div>
      </div>
      ${ticket.price ? `
      <div class="detail-item">
        <div class="label">Total Price</div>
        <div class="value">$${ticket.price}</div>
      </div>` : ''}
      ${ticket.email ? `
      <div class="detail-item">
        <div class="label">Email</div>
        <div class="value">${ticket.email}</div>
      </div>` : ''}
    </div>
  </div>
  <div class="ticket-footer">
    <div>
      <div class="brand">HostFlow AI</div>
    </div>
    <div class="qr-section">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(qrValue)}" width="80" height="80" alt="QR Code" />
      <div class="qr-label">Scan to verify</div>
    </div>
  </div>
</div>
<script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

    printWindow.document.write(ticketHTML);
    printWindow.document.close();
    setPrinting(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <div ref={ticketRef}>
          {/* Ticket Header */}
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{ background: `linear-gradient(135deg, ${info.color}, ${info.accent})` }}
          >
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5 text-white" />
              <div>
                <p className="text-white text-xs font-bold tracking-[3px]">{info.label}</p>
                <p className="text-white/70 text-[10px]">REF: {ticket.bookingRef}</p>
              </div>
            </div>
            <Badge className="text-[10px] bg-white/20 text-white border-0 uppercase tracking-wider">
              {ticket.status}
            </Badge>
          </div>

          {/* Ticket Body */}
          <div className="p-6 space-y-5">
            {/* Passenger */}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[1.5px]">{terms.passenger}</p>
              <p className="text-xl font-extrabold text-foreground">{ticket.passengerName}</p>
            </div>

            {/* Route / Time */}
            <div className="flex items-center justify-between py-4 border-y border-dashed border-border">
              <div className="text-center flex-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{terms.from}</p>
                <p className="text-lg font-bold text-foreground">
                  {departureDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {departureDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </p>
              </div>
              <div className="px-3" style={{ color: info.color }}>→</div>
              <div className="text-center flex-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{terms.to}</p>
                <p className="text-lg font-bold text-foreground">
                  {arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {arrivalDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{terms.resource}</p>
                <p className="text-sm font-semibold text-foreground">{ticket.resourceName}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Platform</p>
                <p className="text-sm font-semibold text-foreground capitalize">{ticket.platform || "Direct"}</p>
              </div>
              {ticket.price != null && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Price</p>
                  <p className="text-sm font-semibold text-foreground">${ticket.price}</p>
                </div>
              )}
              {ticket.email && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Email</p>
                  <p className="text-sm font-semibold text-foreground truncate">{ticket.email}</p>
                </div>
              )}
            </div>

            {/* QR Code */}
            <div className="flex items-center justify-between pt-4 border-t border-dashed border-border">
              <div>
                <p className="text-[10px] text-muted-foreground">Powered by</p>
                <p className="text-sm font-bold text-foreground">HostFlow AI</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <QRCodeSVG value={qrValue} size={72} level="M" />
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Scan to verify</p>
              </div>
            </div>
          </div>
        </div>

        {/* Download Button */}
        <div className="p-4 border-t border-border">
          <Button
            onClick={handleDownload}
            disabled={printing}
            className="w-full font-semibold"
            style={{ background: `linear-gradient(135deg, ${info.color}, ${info.accent})`, color: "white" }}
          >
            <Download className="w-4 h-4 mr-2" />
            Download Ticket (PDF)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TicketModal;
