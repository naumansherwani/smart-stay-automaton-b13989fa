import { format, addHours, startOfDay, isSameDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import type { IndustryConfig } from "@/lib/industryConfig";

interface TimeSlot {
  id: string;
  resource: string;
  client: string;
  start: Date;
  end: Date;
  status: string;
}

interface ScheduleTimelineProps {
  config: IndustryConfig;
}

const ScheduleTimeline = ({ config }: ScheduleTimelineProps) => {
  const today = startOfDay(new Date());
  const hours = Array.from({ length: 12 }, (_, i) => i + 7);

  const demoSlots: TimeSlot[] = [
    { id: "1", resource: `${config.resourceLabel} 1`, client: `${config.clientLabel} A`, start: addHours(today, 8), end: addHours(today, 10), status: "confirmed" },
    { id: "2", resource: `${config.resourceLabel} 1`, client: `${config.clientLabel} B`, start: addHours(today, 11), end: addHours(today, 13), status: "confirmed" },
    { id: "3", resource: `${config.resourceLabel} 2`, client: `${config.clientLabel} C`, start: addHours(today, 9), end: addHours(today, 11.5), status: "pending" },
    { id: "4", resource: `${config.resourceLabel} 2`, client: `${config.clientLabel} D`, start: addHours(today, 14), end: addHours(today, 16), status: "confirmed" },
    { id: "5", resource: `${config.resourceLabel} 3`, client: `${config.clientLabel} E`, start: addHours(today, 7.5), end: addHours(today, 9), status: "confirmed" },
    { id: "6", resource: `${config.resourceLabel} 3`, client: `${config.clientLabel} F`, start: addHours(today, 10), end: addHours(today, 12), status: "in-progress" },
  ];

  const resources = [...new Set(demoSlots.map(s => s.resource))];
  const statusColors: Record<string, string> = {
    confirmed: "bg-primary/80",
    pending: "bg-warning/80",
    "in-progress": "bg-success/80",
    cancelled: "bg-destructive/80",
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Today's Schedule — {format(today, "EEEE, MMM d")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="flex">
              <div className="w-28 flex-shrink-0" />
              <div className="flex-1 flex">
                {hours.map(h => (
                  <div key={h} className="flex-1 text-xs text-muted-foreground text-center border-l border-border px-1 py-1">
                    {h > 12 ? `${h - 12}PM` : h === 12 ? "12PM" : `${h}AM`}
                  </div>
                ))}
              </div>
            </div>
            {resources.map(res => {
              const slots = demoSlots.filter(s => s.resource === res);
              return (
                <div key={res} className="flex border-t border-border">
                  <div className="w-28 flex-shrink-0 py-3 pr-2 text-sm font-medium text-foreground truncate">
                    {res}
                  </div>
                  <div className="flex-1 relative h-12">
                    {hours.map(h => (
                      <div key={h} className="absolute top-0 bottom-0 border-l border-border/50" style={{ left: `${((h - 7) / 12) * 100}%` }} />
                    ))}
                    {slots.map(slot => {
                      const startHour = slot.start.getHours() + slot.start.getMinutes() / 60;
                      const endHour = slot.end.getHours() + slot.end.getMinutes() / 60;
                      const left = ((startHour - 7) / 12) * 100;
                      const width = ((endHour - startHour) / 12) * 100;

                      return (
                        <div
                          key={slot.id}
                          className={`absolute top-1 bottom-1 rounded-md ${statusColors[slot.status] || "bg-primary/60"} text-primary-foreground text-[10px] px-1.5 flex items-center truncate cursor-pointer hover:opacity-90 transition-opacity`}
                          style={{ left: `${left}%`, width: `${width}%` }}
                          title={`${slot.client}: ${format(slot.start, "h:mma")} - ${format(slot.end, "h:mma")}`}
                        >
                          {slot.client}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScheduleTimeline;
