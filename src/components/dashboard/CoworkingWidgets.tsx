import { Building2, Users, Monitor, Clock, Coffee } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function DeskMap() {
  const zones = [
    { zone: "Open Floor A", total: 40, occupied: 32, type: "Hot Desk" },
    { zone: "Open Floor B", total: 30, occupied: 28, type: "Hot Desk" },
    { zone: "Private Offices", total: 12, occupied: 11, type: "Dedicated" },
    { zone: "Meeting Rooms", total: 8, occupied: 5, type: "Bookable" },
    { zone: "Phone Booths", total: 6, occupied: 4, type: "Drop-in" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Monitor className="w-4 h-4 text-primary" />Space Occupancy</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {zones.map(z => (
          <div key={z.zone} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-foreground">{z.zone} <span className="text-[10px] text-muted-foreground">({z.type})</span></span>
              <span className={`text-xs ${z.occupied >= z.total ? "text-destructive" : "text-muted-foreground"}`}>{z.occupied}/{z.total}</span>
            </div>
            <Progress value={(z.occupied / z.total) * 100} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function MeetingRoomAvailability() {
  const rooms = [
    { name: "Board Room", capacity: 12, nextFree: "Now", bookings: 3, amenities: "TV, Whiteboard" },
    { name: "Focus Room A", capacity: 4, nextFree: "11:30 AM", bookings: 5, amenities: "TV" },
    { name: "Creative Lab", capacity: 8, nextFree: "Now", bookings: 2, amenities: "Whiteboard, Markers" },
    { name: "Zen Room", capacity: 6, nextFree: "2:00 PM", bookings: 4, amenities: "Soundproof" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" />Meeting Rooms</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {rooms.map(r => (
          <div key={r.name} className="flex items-center justify-between p-2 rounded-lg border border-border">
            <div>
              <p className="text-sm font-medium text-foreground">{r.name} ({r.capacity} seats)</p>
              <p className="text-[10px] text-muted-foreground">{r.amenities} · {r.bookings} bookings today</p>
            </div>
            <Badge variant="outline" className={`text-[10px] ${r.nextFree === "Now" ? "text-success" : "text-warning"}`}>
              {r.nextFree === "Now" ? "Available" : `Free at ${r.nextFree}`}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function MemberCheckins() {
  const recent = [
    { name: "Alex T.", time: "8:45 AM", type: "Hot Desk", zone: "Open Floor A" },
    { name: "Maria G.", time: "9:02 AM", type: "Private Office", zone: "Office #3" },
    { name: "Sam K.", time: "9:15 AM", type: "Day Pass", zone: "Open Floor B" },
    { name: "Priya R.", time: "9:30 AM", type: "Hot Desk", zone: "Open Floor A" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4 text-primary" />Recent Check-ins</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {recent.map(r => (
          <div key={r.name} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{r.time}</span>
              <span className="text-sm font-medium text-foreground">{r.name}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">{r.type} · {r.zone}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
