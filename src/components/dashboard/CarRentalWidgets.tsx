import { Car, Wrench, MapPin, Fuel, AlertTriangle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function FleetStatusBoard() {
  const vehicles = [
    { id: "V-001", model: "Tesla Model 3", status: "rented", renter: "J. Smith", returnDate: "Apr 10", mileage: 12450 },
    { id: "V-002", model: "Toyota Camry", status: "available", renter: "—", returnDate: "—", mileage: 34200 },
    { id: "V-003", model: "BMW X5", status: "maintenance", renter: "—", returnDate: "Apr 9", mileage: 28900 },
    { id: "V-004", model: "Honda Civic", status: "rented", renter: "A. Chen", returnDate: "Apr 12", mileage: 45600 },
    { id: "V-005", model: "Ford Mustang", status: "overdue", renter: "R. Davis", returnDate: "Apr 7", mileage: 19800 },
  ];
  const statusColors: Record<string, string> = { rented: "text-primary", available: "text-success", maintenance: "text-warning", overdue: "text-destructive" };

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Car className="w-4 h-4 text-primary" />Fleet Status Board</CardTitle></CardHeader>
      <CardContent className="space-y-2.5">
        {vehicles.map(v => (
          <div key={v.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border">
            <div>
              <p className="text-sm font-medium text-foreground">{v.model}</p>
              <p className="text-[10px] text-muted-foreground">{v.id} · {v.mileage.toLocaleString()} mi · {v.renter !== "—" ? `Renter: ${v.renter}` : "No renter"}</p>
            </div>
            <div className="text-right">
              <span className={`text-xs font-medium capitalize ${statusColors[v.status]}`}>{v.status}</span>
              {v.returnDate !== "—" && <p className="text-[10px] text-muted-foreground">Return: {v.returnDate}</p>}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function DamageReports() {
  const reports = [
    { vehicle: "V-003 BMW X5", type: "Scratch", location: "Rear bumper", cost: "$180", date: "Apr 6", status: "repair" },
    { vehicle: "V-005 Ford Mustang", type: "Tire damage", location: "Front-left", cost: "$95", date: "Apr 5", status: "pending" },
    { vehicle: "V-001 Tesla Model 3", type: "Interior stain", location: "Back seat", cost: "$45", date: "Apr 4", status: "resolved" },
  ];
  const statusColors: Record<string, string> = { repair: "bg-warning/10 text-warning", pending: "bg-destructive/10 text-destructive", resolved: "bg-success/10 text-success" };

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-warning" />Damage Reports</CardTitle></CardHeader>
      <CardContent className="space-y-2.5">
        {reports.map((r, i) => (
          <div key={i} className="p-3 rounded-lg border border-border space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{r.vehicle}</span>
              <Badge variant="outline" className={`text-[10px] ${statusColors[r.status]}`}>{r.status}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{r.type} — {r.location}</p>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Est. cost: {r.cost}</span><span>{r.date}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function UtilizationChart() {
  const categories = [
    { type: "Economy", total: 25, rented: 20, rate: 80 },
    { type: "SUV", total: 12, rented: 10, rate: 83 },
    { type: "Luxury", total: 8, rented: 5, rate: 63 },
    { type: "Electric", total: 10, rented: 9, rate: 90 },
    { type: "Van", total: 5, rented: 3, rate: 60 },
  ];

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" />Fleet Utilization by Category</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {categories.map(c => (
          <div key={c.type} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-foreground">{c.type}</span>
              <span className="text-muted-foreground">{c.rented}/{c.total} ({c.rate}%)</span>
            </div>
            <Progress value={c.rate} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
