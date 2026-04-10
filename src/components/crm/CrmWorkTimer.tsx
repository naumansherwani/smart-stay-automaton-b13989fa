import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Coffee, Timer, StopCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

type SessionType = "work" | "break";

interface WorkSession {
  id: string;
  session_type: SessionType;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
}

interface CrmWorkTimerProps {
  onBreakChange?: (isOnBreak: boolean) => void;
}

export default function CrmWorkTimer({ onBreakChange }: CrmWorkTimerProps) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [activeSession, setActiveSession] = useState<WorkSession | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [todayWork, setTodayWork] = useState(0);
  const [todayBreak, setTodayBreak] = useState(0);

  const industry = profile?.industry || "hospitality";

  // Fetch today's sessions
  const fetchToday = useCallback(async () => {
    if (!user) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data } = await supabase
      .from("crm_work_sessions")
      .select("*")
      .eq("user_id", user.id)
      .gte("started_at", today.toISOString());

    if (data) {
      let work = 0, brk = 0;
      const sessions = data as unknown as WorkSession[];
      sessions.forEach(s => {
        if (s.ended_at) {
          if (s.session_type === "work") work += s.duration_seconds;
          else brk += s.duration_seconds;
        }
      });
      setTodayWork(work);
      setTodayBreak(brk);

      const active = sessions.find(s => !s.ended_at);
      if (active) {
        setActiveSession(active);
        const startTime = new Date(active.started_at).getTime();
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }
    }
  }, [user]);

  useEffect(() => { fetchToday(); }, [fetchToday]);

  // Live timer
  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(() => {
      const startTime = new Date(activeSession.started_at).getTime();
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const startSession = async (type: SessionType) => {
    if (!user) return;
    // End any active session first
    if (activeSession) await endSession();

    const { data, error } = await supabase
      .from("crm_work_sessions")
      .insert({ user_id: user.id, industry, session_type: type })
      .select()
      .single();

    if (!error && data) {
      const session = data as unknown as WorkSession;
      setActiveSession(session);
      setElapsed(0);
      onBreakChange?.(type === "break");
      toast.success(type === "work" ? "🟢 Work mode started!" : "☕ Break started!");
    }
  };

  const endSession = async () => {
    if (!activeSession || !user) return;
    const duration = Math.floor((Date.now() - new Date(activeSession.started_at).getTime()) / 1000);

    await supabase
      .from("crm_work_sessions")
      .update({ ended_at: new Date().toISOString(), duration_seconds: duration })
      .eq("id", activeSession.id);

    if (activeSession.session_type === "work") setTodayWork(prev => prev + duration);
    else setTodayBreak(prev => prev + duration);

    setActiveSession(null);
    setElapsed(0);
    onBreakChange?.(false);
    toast.success("Session ended");
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const isWorking = activeSession?.session_type === "work";
  const isOnBreak = activeSession?.session_type === "break";

  return (
    <Card className={`${isWorking ? "ring-2 ring-green-500/50 bg-green-500/5" : isOnBreak ? "ring-2 ring-yellow-500/50 bg-yellow-500/5" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isWorking ? "bg-green-500/20" : isOnBreak ? "bg-yellow-500/20" : "bg-muted"}`}>
              {isWorking ? <Play className="h-5 w-5 text-green-500" /> : isOnBreak ? <Coffee className="h-5 w-5 text-yellow-500" /> : <Timer className="h-5 w-5 text-muted-foreground" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-mono text-2xl font-bold">{formatTime(elapsed)}</p>
                {activeSession && (
                  <Badge variant={isWorking ? "default" : "secondary"} className={`${isWorking ? "bg-green-500" : "bg-yellow-500"} text-white animate-pulse`}>
                    {isWorking ? "Working" : "Break"}
                  </Badge>
                )}
              </div>
              <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                <span>Today: 🟢 {formatTime(todayWork + (isWorking ? elapsed : 0))}</span>
                <span>☕ {formatTime(todayBreak + (isOnBreak ? elapsed : 0))}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {!activeSession ? (
              <>
                <Button size="sm" onClick={() => startSession("work")} className="bg-green-600 hover:bg-green-700">
                  <Play className="h-4 w-4 mr-1" />Start Work
                </Button>
                <Button size="sm" variant="outline" onClick={() => startSession("break")}>
                  <Coffee className="h-4 w-4 mr-1" />Break
                </Button>
              </>
            ) : (
              <>
                {isWorking && (
                  <Button size="sm" variant="outline" onClick={() => startSession("break")}>
                    <Coffee className="h-4 w-4 mr-1" />Take Break
                  </Button>
                )}
                {isOnBreak && (
                  <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => startSession("work")}>
                    <Play className="h-4 w-4 mr-1" />Resume Work
                  </Button>
                )}
                <Button size="sm" variant="destructive" onClick={endSession}>
                  <StopCircle className="h-4 w-4 mr-1" />Stop
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
