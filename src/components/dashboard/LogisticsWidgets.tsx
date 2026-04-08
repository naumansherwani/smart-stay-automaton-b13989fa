import { Truck, Package, MapPin, Clock, AlertTriangle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function DeliveryTrackingBoard() {
  const shipments = [
    { id: "SHP-4821", origin: "NYC", dest: "Chicago", driver: "T. Johnson", status: "in-transit", eta: "3h 20m", progress: 65 },
    { id: "SHP-4822", origin: "LA", dest: "Phoenix", driver: "M. Garcia", status: "loading", eta: "6h 45m", progress: 10 },
    { id: "SHP-4823", origin: "Miami", dest: "Atlanta", driver: "K. Williams", status: "delivered", eta: "Done", progress: 100 },
    { id: "SHP-4824", origin: "Seattle", dest: "Portland", driver: "R. Lee", status: "delayed", eta: "+2h late", progress: 40 },
  ];
  const statusColors: Record<string, string> = { "in-transit": "text-primary", loading: "text-warning", delivered: "text-success", delayed: "text-destructive" };

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Truck className="w-4 h-4 text-primary" />Live Shipment Tracking</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {shipments.map(s => (
          <div key={s.id} className="space-y-2 p-2.5 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{s.id}: {s.origin} → {s.dest}</p>
                <p className="text-[10px] text-muted-foreground">Driver: {s.driver}</p>
              </div>
              <div className="text-right">
                <span className={`text-xs capitalize ${statusColors[s.status]}`}>{s.status}</span>
                <p className="text-[10px] text-muted-foreground">ETA: {s.eta}</p>
              </div>
            </div>
            <Progress value={s.progress} className="h-1.5" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function WarehouseCapacity() {
  const bays = [
    { bay: "Bay A", type: "Loading", capacity: 85, items: 42, status: "active" },
    { bay: "Bay B", type: "Sorting", capacity: 62, items: 28, status: "active" },
    { bay: "Bay C", type: "Cold Storage", capacity: 91, items: 55, status: "near-full" },
    { bay: "Bay D", type: "Loading", capacity: 30, items: 12, status: "available" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Package className="w-4 h-4 text-primary" />Warehouse Capacity</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {bays.map(b => (
          <div key={b.bay} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-foreground">{b.bay} ({b.type})</span>
              <span className={`text-xs ${b.capacity > 85 ? "text-destructive" : "text-muted-foreground"}`}>{b.capacity}% · {b.items} items</span>
            </div>
            <Progress value={b.capacity} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function DriverSchedule() {
  const drivers = [
    { name: "T. Johnson", status: "driving", hoursLeft: 4.5, route: "NYC→Chicago", nextBreak: "1h 20m" },
    { name: "M. Garcia", status: "loading", hoursLeft: 8, route: "LA→Phoenix", nextBreak: "—" },
    { name: "K. Williams", status: "off-duty", hoursLeft: 0, route: "—", nextBreak: "—" },
    { name: "R. Lee", status: "driving", hoursLeft: 3, route: "SEA→PDX", nextBreak: "45m" },
  ];
  const statusColors: Record<string, string> = { driving: "text-primary", loading: "text-warning", "off-duty": "text-muted-foreground" };

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4 text-primary" />Driver Schedule & HOS</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {drivers.map(d => (
          <div key={d.name} className="flex items-center justify-between p-2 rounded-lg border border-border">
            <div>
              <p className="text-sm font-medium text-foreground">{d.name}</p>
              <p className="text-[10px] text-muted-foreground">{d.route} · Break in: {d.nextBreak}</p>
            </div>
            <div className="text-right">
              <span className={`text-xs capitalize ${statusColors[d.status]}`}>{d.status}</span>
              <p className="text-[10px] text-muted-foreground">{d.hoursLeft}h left</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
