import { useState, useCallback } from "react";
import { useConversation } from "@elevenlabs/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Volume2, Loader2, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  industry: string;
  onCommand?: (command: string, params?: any) => void;
}

export default function CrmVoiceAssistant({ industry, onCommand }: Props) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [agentId, setAgentId] = useState("");

  const conversation = useConversation({
    onConnect: () => {
      toast.success("Voice assistant connected!");
    },
    onDisconnect: () => {
      toast.info("Voice assistant disconnected");
    },
    onMessage: (message: any) => {
      if (message?.type === "user_transcript" && message?.user_transcription_event) {
        setTranscript(prev => [...prev.slice(-9), `You: ${message.user_transcription_event.user_transcript}`]);
      }
      if (message?.type === "agent_response" && message?.agent_response_event) {
        setTranscript(prev => [...prev.slice(-9), `AI: ${message.agent_response_event.agent_response}`]);
      }
    },
    onError: (error) => {
      console.error("Voice error:", error);
      toast.error("Voice connection error");
    },
  });

  const startConversation = useCallback(async () => {
    if (!agentId.trim()) {
      toast.error("Please enter your ElevenLabs Agent ID");
      return;
    }
    setIsConnecting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const { data, error } = await supabase.functions.invoke("elevenlabs-conversation-token", {
        body: { agent_id: agentId },
      });

      if (error || !data?.signed_url) {
        throw new Error(data?.error || "Failed to get voice token");
      }

      await conversation.startSession({
        signedUrl: data.signed_url,
      });
    } catch (err: any) {
      console.error("Failed to start voice:", err);
      toast.error(err.message || "Could not connect to voice assistant");
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, agentId]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
    setTranscript([]);
  }, [conversation]);

  // Floating button when panel is closed
  if (!showPanel) {
    return (
      <Button
        onClick={() => setShowPanel(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
      >
        <Mic className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80">
      <Card className="shadow-2xl border-primary/20">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">AI Voice Assistant</span>
              {conversation.status === "connected" && (
                <Badge variant="secondary" className="text-[10px]">
                  {conversation.isSpeaking ? "Speaking..." : "Listening"}
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowPanel(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Agent ID Input */}
          {conversation.status === "disconnected" && (
            <div className="mb-3">
              <input
                type="text"
                placeholder="ElevenLabs Agent ID..."
                value={agentId}
                onChange={e => setAgentId(e.target.value)}
                className="w-full text-xs p-2 rounded border bg-background text-foreground"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Create an agent at elevenlabs.io/conversational-ai
              </p>
            </div>
          )}

          {/* Transcript */}
          {transcript.length > 0 && (
            <div className="mb-3 max-h-40 overflow-y-auto space-y-1 text-xs bg-muted/50 rounded p-2">
              {transcript.map((t, i) => (
                <p key={i} className={t.startsWith("AI:") ? "text-primary font-medium" : "text-muted-foreground"}>
                  {t}
                </p>
              ))}
            </div>
          )}

          {/* Voice Indicator */}
          {conversation.status === "connected" && (
            <div className="flex items-center justify-center mb-3">
              <div className={`h-16 w-16 rounded-full flex items-center justify-center transition-all ${
                conversation.isSpeaking
                  ? "bg-primary/20 animate-pulse ring-4 ring-primary/30"
                  : "bg-muted"
              }`}>
                {conversation.isSpeaking ? (
                  <Volume2 className="h-7 w-7 text-primary" />
                ) : (
                  <Mic className="h-7 w-7 text-muted-foreground" />
                )}
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-2">
            {conversation.status === "disconnected" ? (
              <Button className="w-full" onClick={startConversation} disabled={isConnecting || !agentId.trim()}>
                {isConnecting ? (
                  <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Connecting...</>
                ) : (
                  <><Mic className="h-4 w-4 mr-1" />Start Voice</>
                )}
              </Button>
            ) : (
              <Button variant="destructive" className="w-full" onClick={stopConversation}>
                <MicOff className="h-4 w-4 mr-1" />End Session
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
