import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Plane, Wrench, Mic, MicOff, AlertTriangle, CheckCircle2,
  Zap, Shield, Activity, Loader2
} from "lucide-react";
import { toast } from "sonner";

interface Aircraft {
  id: string;
  registration: string;
  type: string;
  status: "operational" | "minor-issue";
  healthScore: number;
  flightHours: number;
  maxHours: number;
  lastService: string;
  nextService: string;
  aiAlert: string | null;
  aiPriority: "high" | "medium" | "low" | null;
  currentFlight: string | null;
}

const fleetData: Aircraft[] = [
  {
    id: "1", registration: "N-7842A", type: "Boeing 737-800", status: "operational",
    healthScore: 96, flightHours: 12400, maxHours: 15000, lastService: "2026-03-28",
    nextService: "2026-05-15", aiAlert: null, aiPriority: null, currentFlight: "AA1042"
  },
  {
    id: "2", registration: "N-5519B", type: "Airbus A320neo", status: "minor-issue",
    healthScore: 78, flightHours: 9800, maxHours: 12000, lastService: "2026-02-10",
    nextService: "2026-04-20", aiAlert: "Engine vibration sensor anomaly detected — recommend inspection within 48h",
    aiPriority: "high", currentFlight: "UA589"
  },
  {
    id: "3", registration: "N-3301C", type: "Boeing 757-200", status: "operational",
    healthScore: 91, flightHours: 14200, maxHours: 18000, lastService: "2026-03-05",
    nextService: "2026-06-01", aiAlert: "Hydraulic fluid levels trending down — schedule top-up",
    aiPriority: "medium", currentFlight: "DL221"
  },
  {
    id: "4", registration: "N-6678D", type: "Boeing 737 MAX 8", status: "operational",
    healthScore: 99, flightHours: 3200, maxHours: 15000, lastService: "2026-04-01",
    nextService: "2026-07-01", aiAlert: null, aiPriority: null, currentFlight: null
  },
  {
    id: "5", registration: "N-9920E", type: "Airbus A321LR", status: "minor-issue",
    healthScore: 82, flightHours: 11500, maxHours: 14000, lastService: "2026-01-20",
    nextService: "2026-04-18", aiAlert: "APU start sequence degradation — service overdue in 6 days",
    aiPriority: "high", currentFlight: "SW834"
  },
];

export default function FleetIntelligence() {
  const [listeningAircraft, setListeningAircraft] = useState<string | null>(null);
  const [processingCommand, setProcessingCommand] = useState(false);

  const handleVoiceCommand = useCallback(async (aircraftId: string) => {
    if (listeningAircraft === aircraftId) {
      // Stop listening — simulate a command was received
      setListeningAircraft(null);
      setProcessingCommand(true);

      const aircraft = fleetData.find(a => a.id === aircraftId);
      // Simulate processing
      await new Promise(r => setTimeout(r, 1500));
      setProcessingCommand(false);

      toast.success(
        `🎙️ Voice command processed for ${aircraft?.registration}: Maintenance postponed by 72 hours, AI schedule updated.`,
        { duration: 4000 }
      );
      return;
    }

    // Start listening
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setListeningAircraft(aircraftId);
      toast.info("🎙️ Listening... Say your command (e.g., 'Postpone maintenance for Flight AI-102')");

      // Auto-stop after 5 seconds for demo
      setTimeout(() => {
        setListeningAircraft(prev => {
          if (prev === aircraftId) {
            setProcessingCommand(true);
            const aircraft = fleetData.find(a => a.id === aircraftId);
            setTimeout(() => {
              setProcessingCommand(false);
              toast.success(
                `🎙️ Voice command processed for ${aircraft?.registration}: Maintenance acknowledged, no changes needed.`,
                { duration: 4000 }
              );
            }, 1200);
            return null;
          }
          return prev;
        });
      }, 5000);
    } catch {
      toast.error("Microphone access is required for voice commands.");
    }
  }, [listeningAircraft]);

  const alertCount = fleetData.filter(a => a.aiAlert).length;

  return (
    <Card className="backdrop-blur-xl bg-card/70 border-border/50 shadow-lg shadow-black/[0.03]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4 text-[hsl(263,70%,58%)]" />
            Fleet Intelligence
          </CardTitle>
          <div className="flex items-center gap-2">
            {alertCount > 0 && (
              <Badge variant="destructive" className="text-[10px] gap-1">
                <AlertTriangle className="w-3 h-3" /> {alertCount} Alert{alertCount > 1 ? "s" : ""}
              </Badge>
            )}
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-success/10 border border-success/20">
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span className="text-[9px] font-medium text-success">Live</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">AI-powered aircraft health monitoring & predictive maintenance</p>
      </CardHeader>
      <CardContent className="space-y-2.5 pt-1">
        {fleetData.map((aircraft) => {
          const isListening = listeningAircraft === aircraft.id;
          const healthColor = aircraft.healthScore >= 90
            ? "text-success"
            : aircraft.healthScore >= 75
            ? "text-warning"
            : "text-destructive";
          const healthBg = aircraft.healthScore >= 90
            ? "bg-success"
            : aircraft.healthScore >= 75
            ? "bg-warning"
            : "bg-destructive";
          const dotColor = aircraft.status === "operational"
            ? "bg-success"
            : "bg-warning";

          return (
            <div
              key={aircraft.id}
              className={`p-3 rounded-xl border transition-all ${
                aircraft.aiAlert
                  ? "border-warning/30 bg-warning/[0.03]"
                  : "border-border/60 bg-muted/20"
              } ${isListening ? "ring-2 ring-[hsl(263,70%,58%)]/40" : ""}`}
            >
              {/* Top row: Aircraft info + voice button */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 rounded-lg bg-[hsl(222,47%,11%)]/80 flex items-center justify-center">
                      <Plane className="w-4 h-4 text-[hsl(263,70%,58%)]" />
                    </div>
                    <div className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${dotColor} border-2 border-card`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{aircraft.registration}</p>
                      {aircraft.currentFlight && (
                        <Badge variant="outline" className="text-[9px] h-4 shrink-0">
                          {aircraft.currentFlight}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">{aircraft.type}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Health score */}
                  <div className="text-right hidden sm:block">
                    <p className={`text-sm font-bold ${healthColor}`}>{aircraft.healthScore}%</p>
                    <p className="text-[9px] text-muted-foreground">Health</p>
                  </div>

                  {/* Voice command button */}
                  <Button
                    size="icon"
                    variant={isListening ? "default" : "outline"}
                    className={`h-8 w-8 rounded-full shrink-0 ${
                      isListening
                        ? "bg-[hsl(263,70%,58%)] hover:bg-[hsl(263,70%,48%)] text-white animate-pulse"
                        : "border-[hsl(263,70%,58%)]/30 text-[hsl(263,70%,58%)] hover:bg-[hsl(263,70%,58%)]/10"
                    }`}
                    onClick={() => handleVoiceCommand(aircraft.id)}
                    disabled={processingCommand}
                  >
                    {processingCommand && listeningAircraft === null ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isListening ? (
                      <MicOff className="w-3.5 h-3.5" />
                    ) : (
                      <Mic className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Health bar */}
              <div className="mt-2 flex items-center gap-2">
                <Progress value={aircraft.healthScore} className={`h-1.5 flex-1`} />
                <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                  {aircraft.flightHours.toLocaleString()}/{aircraft.maxHours.toLocaleString()}h
                </span>
              </div>

              {/* AI Maintenance Alert */}
              {aircraft.aiAlert && (
                <div className="mt-2 flex items-start gap-2 p-2 rounded-lg bg-[hsl(222,47%,11%)]/60 border border-[hsl(263,70%,58%)]/20">
                  <Zap className="w-3.5 h-3.5 text-[hsl(263,70%,58%)] mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-semibold text-[hsl(263,70%,58%)]">AI Maintenance Prediction</span>
                      <Badge
                        variant="outline"
                        className={`text-[8px] h-3.5 ${
                          aircraft.aiPriority === "high"
                            ? "text-destructive border-destructive/30"
                            : "text-warning border-warning/30"
                        }`}
                      >
                        {aircraft.aiPriority} priority
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">{aircraft.aiAlert}</p>
                    <p className="text-[9px] text-muted-foreground mt-1">
                      Next service: {aircraft.nextService} · Last: {aircraft.lastService}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Summary footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-[10px] text-muted-foreground">
                {fleetData.filter(a => a.status === "operational").length} Operational
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-warning" />
              <span className="text-[10px] text-muted-foreground">
                {fleetData.filter(a => a.status === "minor-issue").length} Attention
              </span>
            </div>
          </div>
          <span className="text-[9px] text-muted-foreground flex items-center gap-1">
            <Activity className="w-3 h-3" /> AI Task Prioritization Active
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
