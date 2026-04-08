import { Ticket, Users, Calendar, MapPin, Star, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function VenueCalendar() {
  const events = [
    { name: "Tech Conference 2026", venue: "Main Hall", date: "Apr 10-12", capacity: 500, sold: 420, status: "on-sale" },
    { name: "Jazz Night", venue: "Lounge", date: "Apr 14", capacity: 120, sold: 118, status: "almost-full" },
    { name: "Wedding — Park/Chen", venue: "Garden", date: "Apr 18", capacity: 200, sold: 185, status: "private" },
    { name: "Comedy Show", venue: "Theater", date: "Apr 20", capacity: 300, sold: 89, status: "on-sale" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" />Upcoming Events</CardTitle></CardHeader>
      <CardContent className="space-y-2.5">
        {events.map(e => (
          <div key={e.name} className="p-2.5 rounded-lg border border-border space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">{e.name}</p>
              <Badge variant="outline" className="text-[10px]">{e.status}</Badge>
            </div>
            <p className="text-[10px] text-muted-foreground">{e.venue} · {e.date}</p>
            <div className="flex items-center gap-2">
              <Progress value={(e.sold / e.capacity) * 100} className="h-1.5 flex-1" />
              <span className="text-[10px] text-muted-foreground">{e.sold}/{e.capacity}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function VendorCoordination() {
  const vendors = [
    { name: "SoundTech Pro", type: "Audio/Visual", event: "Tech Conference", status: "confirmed", cost: "$2,400" },
    { name: "Bella Catering", type: "Food & Bev", event: "Wedding", status: "confirmed", cost: "$8,500" },
    { name: "FlowerLux", type: "Decor", event: "Wedding", status: "pending", cost: "$1,200" },
    { name: "DJ Marco", type: "Entertainment", event: "Jazz Night", status: "confirmed", cost: "$800" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4 text-primary" />Vendor Coordination</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {vendors.map(v => (
          <div key={v.name} className="flex items-center justify-between p-2 rounded-lg border border-border">
            <div>
              <p className="text-sm font-medium text-foreground">{v.name}</p>
              <p className="text-[10px] text-muted-foreground">{v.type} · {v.event}</p>
            </div>
            <div className="text-right">
              <Badge variant="outline" className={`text-[10px] ${v.status === "confirmed" ? "text-success" : "text-warning"}`}>{v.status}</Badge>
              <p className="text-[10px] text-muted-foreground">{v.cost}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
