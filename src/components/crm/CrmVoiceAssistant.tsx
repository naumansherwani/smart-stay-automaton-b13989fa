import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, MicOff, Volume2, X, Sparkles, Bot, User, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import type { IndustryType } from "@/lib/industryConfig";
import { getIndustryConfig } from "@/lib/industryConfig";
import { getCrmConfig } from "@/lib/crmConfig";
import { supportsAutoPricing } from "@/lib/industryFeatures";

interface Props {
  industry: IndustryType;
  onCommand?: (command: string, params?: Record<string, string>) => void;
  onNavigate?: (tab: string) => void;
}

interface ChatMessage {
  role: "user" | "ai";
  text: string;
  timestamp: Date;
  action?: string;
}

// ─── Industry-specific command definitions ──────────────────────────────────
interface VoiceCommand {
  keywords: string[];
  action: string;
  tab?: string;
  response: string;
}

function getIndustryCommands(industry: IndustryType): VoiceCommand[] {
  const config = getIndustryConfig(industry);
  const crmConfig = getCrmConfig(industry);
  const hasPricing = supportsAutoPricing(industry);

  // Universal commands for all industries
  const universal: VoiceCommand[] = [
    { keywords: ["contacts", "passengers", "guests", "patients", "students", "clients", "renters", "organizers", crmConfig.contactLabelPlural.toLowerCase()], action: "navigate", tab: "contacts", response: `Opening ${crmConfig.contactLabelPlural} management for you. Here you can view, search, and manage all your ${crmConfig.contactLabelPlural.toLowerCase()}.` },
    { keywords: ["tickets", "complaints", "requests", "cases", "claims", "issues", crmConfig.ticketLabelPlural.toLowerCase()], action: "navigate", tab: "tickets", response: `Opening ${crmConfig.ticketLabelPlural}. You can track and resolve all ${crmConfig.ticketLabelPlural.toLowerCase()} here.` },
    { keywords: ["deals", "bookings", "contracts", "enrollments", "sponsorships", crmConfig.dealLabelPlural.toLowerCase()], action: "navigate", tab: "deals", response: `Opening ${crmConfig.dealLabelPlural}. Here's your pipeline and ${crmConfig.dealLabelPlural.toLowerCase()} overview.` },
    { keywords: ["activities", "activity", "log", "history"], action: "navigate", tab: "activities", response: "Opening Activities log. You can see all recent actions and history here." },
    { keywords: ["analytics", "reports", "revenue", "chart"], action: "navigate", tab: "analytics", response: "Opening Analytics dashboard. Here's your revenue data and performance charts." },
    { keywords: ["ai", "insights", "artificial intelligence", "predictions"], action: "navigate", tab: "ai-insights", response: "Opening AI Insights. I'll show you AI-powered predictions and recommendations." },
    { keywords: ["email", "compose", "write email", "send email"], action: "navigate", tab: "email-composer", response: "Opening AI Email Composer. Choose a tone and I'll help you craft the perfect email." },
    { keywords: ["forecast", "predict revenue", "revenue forecast"], action: "navigate", tab: "revenue-forecast", response: "Opening Predictive Revenue Forecast. Here's what AI predicts for your upcoming revenue." },
    { keywords: ["competitor", "competition", "market"], action: "navigate", tab: "competitor-intel", response: "Opening Competitor Intelligence. Let me show you how you compare to your competitors." },
    { keywords: ["sentiment", "feedback", "mood", "satisfaction"], action: "navigate", tab: "sentiment", response: "Opening Sentiment Dashboard. Here's how your customers are feeling." },
    { keywords: ["meeting", "schedule meeting", "calendar", "appointment"], action: "navigate", tab: "meeting-scheduler", response: "Opening Smart Meeting Scheduler. Let me help you find the perfect time." },
    { keywords: ["performance", "productivity", "stats"], action: "navigate", tab: "performance", response: "Opening Performance Dashboard. Here's your productivity and performance data." },
    { keywords: ["security", "alerts", "threats"], action: "navigate", tab: "security", response: "Opening Security Panel. All security alerts and access logs are here." },
    { keywords: ["connect", "industry", "network"], action: "navigate", tab: "industry-connect", response: "Opening Industry Connect. Connect with others in your industry." },
    { keywords: ["overview", "dashboard", "home", "main"], action: "navigate", tab: "overview", response: "Taking you to the Overview. Here's your complete CRM dashboard at a glance." },
    { keywords: ["help", "what can you do", "commands", "features"], action: "help", response: "" },
    { keywords: ["hello", "hi", "hey", "good morning", "good afternoon", "good evening"], action: "greet", response: "" },
    { keywords: ["thank you", "thanks", "thank", "appreciate"], action: "thanks", response: "You're welcome! I'm always here to help. Just say any command or ask me anything about your CRM." },
    { keywords: ["bye", "goodbye", "see you", "close"], action: "close", response: "Goodbye! Tap the microphone anytime you need me. Have a productive day!" },
  ];

  // Industry-specific commands
  const industrySpecific: Record<string, VoiceCommand[]> = {
    airlines: [
      { keywords: ["flight ops", "flight operations", "flights", "flight schedule"], action: "navigate", tab: "flight-ops", response: "Opening Flight Operations Calendar. Here's your flight schedule with seat availability and AI pricing." },
      { keywords: ["pricing", "price", "ticket price", "fare"], action: "navigate", tab: "tool-ai-pricing", response: "Opening AI Pricing. I'll show you dynamic ticket prices based on demand and competition." },
      { keywords: ["delay", "disruption", "cancelled", "delayed flight"], action: "navigate", tab: "tickets", response: "Opening Complaints for disruption management. I can help you resolve passenger issues." },
      { keywords: ["crew", "pilot", "staff scheduling"], action: "navigate", tab: "tool-ai-scheduling", response: "Opening AI Scheduling for crew management. AI will optimize your crew rotations." },
      { keywords: ["route", "routes", "destinations"], action: "navigate", tab: "tool-route-optimizer", response: "Opening Route Optimizer. AI analyzes the best routes based on demand and profitability." },
      { keywords: ["capacity", "load factor", "seats"], action: "navigate", tab: "tool-capacity-planner", response: "Opening Capacity Planner. Here's your seat utilization and demand forecast." },
    ],
    hospitality: [
      { keywords: ["pricing", "price", "room rate", "rates"], action: "navigate", tab: "tool-ai-pricing", response: "Opening AI Pricing. I'll show you dynamic room rates based on demand and seasonality." },
      { keywords: ["booking", "reservation", "check in", "check out"], action: "navigate", tab: "tool-manual-booking", response: "Opening Manual Booking. Create a new reservation with full control." },
      { keywords: ["rooms", "resources", "property"], action: "navigate", tab: "tool-resource-mgmt", response: "Opening Resource Manager. Manage your rooms, amenities, and availability." },
      { keywords: ["schedule", "calendar"], action: "navigate", tab: "tool-ai-calendar", response: "Opening AI Calendar. Your smart schedule with auto-optimization is ready." },
    ],
    car_rental: [
      { keywords: ["fleet", "vehicles", "cars"], action: "navigate", tab: "tool-fleet-mgmt", response: "Opening Fleet Manager. Track and manage all your vehicles here." },
      { keywords: ["pricing", "rental price", "rates"], action: "navigate", tab: "tool-ai-pricing", response: "Opening AI Pricing. Dynamic rental rates based on demand and availability." },
      { keywords: ["booking", "rental", "reservation"], action: "navigate", tab: "tool-manual-booking", response: "Opening Manual Booking for new rental creation." },
      { keywords: ["capacity", "availability"], action: "navigate", tab: "tool-capacity-planner", response: "Opening Capacity Planner. See vehicle availability and demand forecast." },
    ],
    healthcare: [
      { keywords: ["schedule", "appointment", "slots"], action: "navigate", tab: "tool-ai-scheduling", response: "Opening AI Scheduling. Intelligent appointment scheduling for your practice." },
      { keywords: ["booking", "appointment booking"], action: "navigate", tab: "tool-manual-booking", response: "Opening Manual Booking to schedule a new patient appointment." },
      { keywords: ["rooms", "equipment", "resources"], action: "navigate", tab: "tool-resource-mgmt", response: "Opening Resource Manager for rooms and equipment management." },
    ],
    education: [
      { keywords: ["schedule", "timetable", "classes"], action: "navigate", tab: "tool-ai-scheduling", response: "Opening AI Scheduling. Smart timetable management for your institution." },
      { keywords: ["booking", "class booking", "enrollment"], action: "navigate", tab: "tool-manual-booking", response: "Opening Manual Booking for class enrollment." },
      { keywords: ["capacity", "room capacity", "seats"], action: "navigate", tab: "tool-capacity-planner", response: "Opening Capacity Planner. See classroom utilization and availability." },
      { keywords: ["rooms", "labs", "resources"], action: "navigate", tab: "tool-resource-mgmt", response: "Opening Resource Manager for rooms and lab management." },
    ],
    logistics: [
      { keywords: ["route", "routes", "delivery"], action: "navigate", tab: "tool-route-optimizer", response: "Opening Route Optimizer. AI-optimized delivery routes are ready." },
      { keywords: ["fleet", "vehicles", "trucks"], action: "navigate", tab: "tool-fleet-mgmt", response: "Opening Fleet Manager. Track all your vehicles and drivers." },
      { keywords: ["capacity", "load", "shipment"], action: "navigate", tab: "tool-capacity-planner", response: "Opening Capacity Planner for shipment and load management." },
      { keywords: ["schedule", "dispatch"], action: "navigate", tab: "tool-ai-scheduling", response: "Opening AI Scheduling for dispatch optimization." },
    ],
    events_entertainment: [
      { keywords: ["pricing", "ticket price", "rates"], action: "navigate", tab: "tool-ai-pricing", response: "Opening AI Pricing. Dynamic ticket pricing based on demand and event data." },
      { keywords: ["capacity", "venue", "seats"], action: "navigate", tab: "tool-capacity-planner", response: "Opening Capacity Planner. Venue capacity and availability overview." },
      { keywords: ["schedule", "calendar", "events"], action: "navigate", tab: "tool-ai-calendar", response: "Opening AI Calendar for event scheduling and management." },
      { keywords: ["booking", "ticket booking"], action: "navigate", tab: "tool-manual-booking", response: "Opening Manual Booking for new ticket/event booking." },
    ],
    railways: [
      { keywords: ["pricing", "ticket price", "fare"], action: "navigate", tab: "tool-ai-pricing", response: "Opening AI Pricing. Dynamic rail ticket pricing based on demand." },
      { keywords: ["route", "routes", "trains"], action: "navigate", tab: "tool-route-optimizer", response: "Opening Route Optimizer for train route management." },
      { keywords: ["capacity", "coaches", "seats"], action: "navigate", tab: "tool-capacity-planner", response: "Opening Capacity Planner for coach and seat availability." },
      { keywords: ["schedule", "timetable"], action: "navigate", tab: "tool-ai-scheduling", response: "Opening AI Scheduling for train timetable management." },
    ],
  };

  return [...universal, ...(industrySpecific[industry] || [])];
}

// ─── Generate help response based on industry ───────────────────────────────
function getHelpResponse(industry: IndustryType): string {
  const config = getIndustryConfig(industry);
  const crmConfig = getCrmConfig(industry);
  const hasPricing = supportsAutoPricing(industry);

  let help = `Hi! I'm Aria, your AI CRM assistant for ${config.label}. Here's what I can do:\n\n`;
  help += `📋 "${crmConfig.contactLabelPlural}" — Open ${crmConfig.contactLabelPlural.toLowerCase()} management\n`;
  help += `🎫 "${crmConfig.ticketLabelPlural}" — Open ${crmConfig.ticketLabelPlural.toLowerCase()}\n`;
  help += `💼 "${crmConfig.dealLabelPlural}" — Open ${crmConfig.dealLabelPlural.toLowerCase()}\n`;
  help += `📊 "Analytics" — View revenue and reports\n`;
  help += `🤖 "AI Insights" — Get AI predictions\n`;
  help += `✉️ "Email" — Open AI Email Composer\n`;

  if (hasPricing) {
    help += `💰 "Pricing" — AI dynamic pricing\n`;
  }

  if (industry === "airlines") {
    help += `✈️ "Flight Ops" — Flight operations calendar\n`;
    help += `🗺️ "Routes" — Route optimizer\n`;
  } else if (industry === "logistics") {
    help += `🗺️ "Routes" — Route optimizer\n`;
    help += `🚚 "Fleet" — Fleet management\n`;
  } else if (industry === "car_rental") {
    help += `🚗 "Fleet" — Vehicle management\n`;
  }

  help += `\n💡 You can also just chat with me! Ask me anything.`;
  return help;
}

function getGreetingResponse(industry: IndustryType): string {
  const config = getIndustryConfig(industry);
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return `${timeGreeting}! I'm Aria, your AI assistant for ${config.label} CRM. How can I help you today? You can ask me to open any feature, get insights, or just have a conversation. Say "help" to see all my commands.`;
}

// ─── Text-to-Speech with female voice ───────────────────────────────────────
function speakText(text: string) {
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text.replace(/[📋🎫💼📊🤖✉️💰✈️🗺️🚚🚗💡\n]/g, " ").replace(/\s+/g, " ").trim());

  // Find a female voice
  const voices = window.speechSynthesis.getVoices();
  const femaleVoice = voices.find(v =>
    /female|samantha|victoria|karen|moira|fiona|tessa|google.*female|microsoft.*zira|microsoft.*hazel/i.test(v.name)
  ) || voices.find(v =>
    /en.*us|en.*gb|english/i.test(v.lang) && !/male/i.test(v.name)
  ) || voices[0];

  if (femaleVoice) utterance.voice = femaleVoice;
  utterance.rate = 1.0;
  utterance.pitch = 1.15;
  utterance.volume = 1;

  window.speechSynthesis.speak(utterance);
}

// ─── Speech Recognition ─────────────────────────────────────────────────────
function useSpeechRecognition(onResult: (text: string) => void) {
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);

  const start = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser. Try Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      onResult(text);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = (e: any) => {
      if (e.error !== "no-speech") {
        console.error("Speech error:", e.error);
      }
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [onResult]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return { isListening, start, stop };
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function CrmVoiceAssistant({ industry, onCommand, onNavigate }: Props) {
  const [showPanel, setShowPanel] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasGreeted = useRef(false);

  const commands = getIndustryCommands(industry);

  // Load voices (some browsers load async)
  useEffect(() => {
    window.speechSynthesis?.getVoices();
    const handleVoicesChanged = () => window.speechSynthesis?.getVoices();
    window.speechSynthesis?.addEventListener?.("voiceschanged", handleVoicesChanged);
    return () => window.speechSynthesis?.removeEventListener?.("voiceschanged", handleVoicesChanged);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Track speaking state
  useEffect(() => {
    const check = setInterval(() => {
      setIsSpeaking(window.speechSynthesis?.speaking || false);
    }, 200);
    return () => clearInterval(check);
  }, []);

  const processCommand = useCallback((userText: string) => {
    const lower = userText.toLowerCase().trim();

    // Add user message
    setMessages(prev => [...prev, { role: "user", text: userText, timestamp: new Date() }]);

    // Find matching command
    let matched: VoiceCommand | null = null;
    let bestScore = 0;

    for (const cmd of commands) {
      for (const kw of cmd.keywords) {
        if (lower.includes(kw) && kw.length > bestScore) {
          matched = cmd;
          bestScore = kw.length;
        }
      }
    }

    let aiResponse: string;

    if (matched) {
      if (matched.action === "help") {
        aiResponse = getHelpResponse(industry);
      } else if (matched.action === "greet") {
        aiResponse = getGreetingResponse(industry);
      } else if (matched.action === "close") {
        aiResponse = matched.response;
        setTimeout(() => setShowPanel(false), 2000);
      } else if (matched.action === "navigate" && matched.tab) {
        aiResponse = matched.response;
        onNavigate?.(matched.tab);
        onCommand?.(matched.action, { tab: matched.tab });
      } else {
        aiResponse = matched.response;
      }
    } else {
      // Conversational fallback
      const config = getIndustryConfig(industry);
      if (lower.includes("how are you") || lower.includes("how do you do")) {
        aiResponse = `I'm doing great, thank you! I'm here to help you manage your ${config.label} CRM. What would you like to do?`;
      } else if (lower.includes("what is") || lower.includes("tell me about")) {
        aiResponse = `That's a great question! I specialize in ${config.label} CRM management. I can help you navigate to any feature, manage ${getCrmConfig(industry).contactLabelPlural.toLowerCase()}, check analytics, and more. Try saying "help" to see all my capabilities.`;
      } else if (lower.includes("best") || lower.includes("recommend") || lower.includes("suggest")) {
        aiResponse = `Based on your ${config.label} industry, I'd recommend checking your Analytics for the latest trends, and reviewing AI Insights for smart predictions. Would you like me to open either of those?`;
      } else {
        aiResponse = `I heard "${userText}". I'm Aria, your ${config.label} CRM assistant. I can navigate you to any CRM feature — try saying things like "${getCrmConfig(industry).contactLabelPlural}", "Analytics", "AI Insights", or "help" to see everything I can do.`;
      }
    }

    setMessages(prev => [...prev, {
      role: "ai",
      text: aiResponse,
      timestamp: new Date(),
      action: matched?.tab ? `→ ${matched.tab}` : undefined,
    }]);

    speakText(aiResponse);
  }, [commands, industry, onNavigate, onCommand]);

  const { isListening, start: startListening, stop: stopListening } = useSpeechRecognition(processCommand);

  const handleMicToggle = useCallback(async () => {
    if (isListening) {
      stopListening();
    } else {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        startListening();
      } catch {
        toast.error("Microphone access is required for voice commands.");
      }
    }
  }, [isListening, startListening, stopListening]);

  const handleOpen = useCallback(() => {
    setShowPanel(true);
    if (!hasGreeted.current) {
      hasGreeted.current = true;
      const greeting = getGreetingResponse(industry);
      setMessages([{ role: "ai", text: greeting, timestamp: new Date() }]);
      setTimeout(() => speakText(greeting), 500);
    }
  }, [industry]);

  // Floating mic button when panel is hidden
  if (!showPanel) {
    return (
      <Button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl z-50 bg-gradient-to-br from-purple-600 to-violet-700 hover:from-purple-500 hover:to-violet-600 border-0 group"
        size="icon"
      >
        <div className="relative">
          <Mic className="h-6 w-6 text-white" />
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400 border-2 border-purple-600 animate-pulse" />
        </div>
      </Button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[360px]">
      <Card className="shadow-2xl border-purple-500/30 bg-card/95 backdrop-blur-xl overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-purple-600/90 to-violet-700/90 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  Aria
                  <Sparkles className="h-3 w-3" />
                </h3>
                <p className="text-[10px] text-white/70">AI Voice Assistant • {getIndustryConfig(industry).label}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {isSpeaking && (
                <Badge className="bg-white/20 text-white border-0 text-[9px] animate-pulse">
                  <Volume2 className="h-2.5 w-2.5 mr-0.5" /> Speaking
                </Badge>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/10" onClick={() => { window.speechSynthesis?.cancel(); setShowPanel(false); }}>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          {/* Chat Messages */}
          <ScrollArea className="h-[320px] p-3" ref={scrollRef}>
            <div className="space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "ai" && (
                    <div className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="h-3 w-3 text-purple-500" />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-purple-600 text-white rounded-br-md"
                      : "bg-muted rounded-bl-md"
                  }`}>
                    <p className="whitespace-pre-line leading-relaxed text-[13px]">{msg.text}</p>
                    {msg.action && (
                      <Badge variant="secondary" className="mt-1.5 text-[9px] bg-purple-500/10 text-purple-600 border-purple-500/20">
                        {msg.action}
                      </Badge>
                    )}
                    <p className={`text-[9px] mt-1 ${msg.role === "user" ? "text-white/50" : "text-muted-foreground"}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {msg.role === "user" && (
                    <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
              ))}

              {isListening && (
                <div className="flex gap-2 justify-start">
                  <div className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                    <Bot className="h-3 w-3 text-purple-500" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-md px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      <span className="text-xs text-muted-foreground">Listening...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Voice Control Bar */}
          <div className="border-t border-border/50 p-3 bg-muted/30">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] text-muted-foreground flex-1">
                {isListening ? "🎙️ Speak now..." : isSpeaking ? "🔊 Aria is speaking..." : "Tap mic to speak or give a command"}
              </p>
              <Button
                onClick={handleMicToggle}
                className={`h-11 w-11 rounded-full shrink-0 transition-all ${
                  isListening
                    ? "bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/30"
                    : "bg-gradient-to-br from-purple-600 to-violet-700 hover:from-purple-500 hover:to-violet-600 text-white shadow-lg shadow-purple-500/20"
                }`}
                size="icon"
              >
                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
            </div>

            {/* Quick command hints */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {["Help", getCrmConfig(industry).contactLabelPlural, "Analytics", "AI Insights"].map(hint => (
                <button
                  key={hint}
                  onClick={() => processCommand(hint)}
                  className="text-[10px] px-2 py-1 rounded-full bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 transition-colors border border-purple-500/20"
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
