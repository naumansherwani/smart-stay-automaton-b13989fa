import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, MicOff, Volume2, X, Sparkles, Bot, User, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
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

interface VoiceCommand {
  keywords: string[];
  action: string;
  tab?: string;
  response: string;
}

// ─── Language mapping for Speech APIs ───────────────────────────────────────
const LANG_TO_SPEECH: Record<string, string> = {
  en: "en-US", hi: "hi-IN", ur: "ur-PK", ar: "ar-SA", es: "es-ES",
  fr: "fr-FR", de: "de-DE", "de-CH": "de-CH", pt: "pt-BR",
  zh: "zh-CN", ja: "ja-JP", ko: "ko-KR", tr: "tr-TR",
};

function getSpeechLang(): string {
  const current = i18n.language || "en";
  return LANG_TO_SPEECH[current] || LANG_TO_SPEECH[current.split("-")[0]] || "en-US";
}

// ─── Multilingual greeting responses ────────────────────────────────────────
const GREETINGS: Record<string, { morning: string; afternoon: string; evening: string; night: string; intro: string }> = {
  en: { morning: "Good morning! ☀️", afternoon: "Good afternoon! 🌤️", evening: "Good evening! 🌇", night: "Good night! 🌙", intro: "I'm Aria, your AI assistant for {industry}. How may I help you?" },
  hi: { morning: "सुप्रभात! ☀️", afternoon: "नमस्ते! 🌤️", evening: "शुभ संध्या! 🌇", night: "शुभ रात्रि! 🌙", intro: "मैं Aria हूँ, {industry} के लिए आपकी AI सहायक। मैं आपकी कैसे मदद कर सकती हूँ?" },
  ur: { morning: "صبح بخیر! ☀️", afternoon: "السلام علیکم! 🌤️", evening: "شام بخیر! 🌇", night: "شب بخیر! 🌙", intro: "میں Aria ہوں، {industry} کے لیے آپکی AI اسسٹنٹ۔ میں آپکی کیسے مدد کر سکتی ہوں؟" },
  ar: { morning: "صباح الخير! ☀️", afternoon: "مساء الخير! 🌤️", evening: "مساء الخير! 🌇", night: "تصبح على خير! 🌙", intro: "أنا Aria، مساعدتك الذكية لـ {industry}. كيف يمكنني مساعدتك؟" },
  es: { morning: "¡Buenos días! ☀️", afternoon: "¡Buenas tardes! 🌤️", evening: "¡Buenas tardes! 🌇", night: "¡Buenas noches! 🌙", intro: "Soy Aria, tu asistente de IA para {industry}. ¿En qué puedo ayudarte?" },
  fr: { morning: "Bonjour! ☀️", afternoon: "Bon après-midi! 🌤️", evening: "Bonsoir! 🌇", night: "Bonne nuit! 🌙", intro: "Je suis Aria, votre assistante IA pour {industry}. Comment puis-je vous aider?" },
  de: { morning: "Guten Morgen! ☀️", afternoon: "Guten Tag! 🌤️", evening: "Guten Abend! 🌇", night: "Gute Nacht! 🌙", intro: "Ich bin Aria, Ihre KI-Assistentin für {industry}. Wie kann ich Ihnen helfen?" },
  pt: { morning: "Bom dia! ☀️", afternoon: "Boa tarde! 🌤️", evening: "Boa noite! 🌇", night: "Boa noite! 🌙", intro: "Sou a Aria, sua assistente de IA para {industry}. Como posso ajudá-lo?" },
  zh: { morning: "早上好！☀️", afternoon: "下午好！🌤️", evening: "晚上好！🌇", night: "晚安！🌙", intro: "我是 Aria，{industry} 的 AI 助手。我能帮您什么？" },
  ja: { morning: "おはようございます！☀️", afternoon: "こんにちは！🌤️", evening: "こんばんは！🌇", night: "おやすみなさい！🌙", intro: "私はAriaです。{industry}のAIアシスタントです。何かお手伝いできますか？" },
  ko: { morning: "좋은 아침입니다! ☀️", afternoon: "안녕하세요! 🌤️", evening: "좋은 저녁입니다! 🌇", night: "안녕히 주무세요! 🌙", intro: "저는 Aria입니다. {industry}의 AI 어시스턴트입니다. 어떻게 도와드릴까요?" },
  tr: { morning: "Günaydın! ☀️", afternoon: "İyi günler! 🌤️", evening: "İyi akşamlar! 🌇", night: "İyi geceler! 🌙", intro: "Ben Aria, {industry} için AI asistanınız. Size nasıl yardımcı olabilirim?" },
};

// ─── Industry-specific command definitions ──────────────────────────────────
function getIndustryCommands(industry: IndustryType): VoiceCommand[] {
  const crmConfig = getCrmConfig(industry);
  const hasPricing = supportsAutoPricing(industry);

  const universal: VoiceCommand[] = [
    { keywords: ["contacts", "passengers", "guests", "patients", "students", "clients", "renters", "organizers", crmConfig.contactLabelPlural.toLowerCase()], action: "navigate", tab: "contacts", response: `Opening ${crmConfig.contactLabelPlural} management.` },
    { keywords: ["tickets", "complaints", "requests", "cases", "claims", "issues", crmConfig.ticketLabelPlural.toLowerCase()], action: "navigate", tab: "tickets", response: `Opening ${crmConfig.ticketLabelPlural}.` },
    { keywords: ["deals", "bookings", "contracts", "enrollments", "sponsorships", crmConfig.dealLabelPlural.toLowerCase()], action: "navigate", tab: "deals", response: `Opening ${crmConfig.dealLabelPlural}.` },
    { keywords: ["activities", "activity", "log", "history"], action: "navigate", tab: "activities", response: "Opening Activities log." },
    { keywords: ["analytics", "reports", "revenue", "chart"], action: "navigate", tab: "analytics", response: "Opening Analytics dashboard." },
    { keywords: ["ai", "insights", "artificial intelligence", "predictions"], action: "navigate", tab: "ai-insights", response: "Opening AI Insights." },
    { keywords: ["email", "compose", "write email", "send email"], action: "navigate", tab: "email-composer", response: "Opening AI Email Composer." },
    { keywords: ["forecast", "predict revenue", "revenue forecast"], action: "navigate", tab: "revenue-forecast", response: "Opening Revenue Forecast." },
    { keywords: ["competitor", "competition", "market"], action: "navigate", tab: "competitor-intel", response: "Opening Competitor Intelligence." },
    { keywords: ["sentiment", "feedback", "mood", "satisfaction"], action: "navigate", tab: "sentiment", response: "Opening Sentiment Dashboard." },
    { keywords: ["meeting", "schedule meeting", "appointment"], action: "navigate", tab: "meeting-scheduler", response: "Opening Meeting Scheduler." },
    { keywords: ["performance", "productivity", "stats"], action: "navigate", tab: "performance", response: "Opening Performance Dashboard." },
    { keywords: ["security", "alerts", "threats"], action: "navigate", tab: "security", response: "Opening Security Panel." },
    { keywords: ["connect", "industry", "network"], action: "navigate", tab: "industry-connect", response: "Opening Industry Connect." },
    { keywords: ["overview", "dashboard", "home", "main"], action: "navigate", tab: "overview", response: "Opening Overview." },
    { keywords: ["help", "what can you do", "commands", "features", "مدد", "مساعدة", "ayuda", "aide", "hilfe", "ajuda", "帮助", "ヘルプ", "도움", "yardım"], action: "help", response: "" },
    { keywords: ["hello", "hi", "hey", "good morning", "good afternoon", "good evening", "سلام", "نمستے", "مرحبا", "hola", "bonjour", "hallo", "olá", "你好", "こんにちは", "안녕", "merhaba", "السلام علیکم"], action: "greet", response: "" },
    { keywords: ["thank you", "thanks", "شکریہ", "شكرا", "gracias", "merci", "danke", "obrigado", "谢谢", "ありがとう", "감사", "teşekkür"], action: "thanks", response: "You're welcome! I'm always here to help." },
    { keywords: ["bye", "goodbye", "see you", "close", "خدا حافظ", "مع السلامة", "adiós", "au revoir", "tschüss", "tchau", "再见", "さようなら", "안녕히", "hoşça kal"], action: "close", response: "Goodbye! Tap the microphone anytime you need me." },
    // ── AI Calendar commands ──
    { keywords: ["calendar", "schedule", "تقویم", "جدول", "calendario", "calendrier", "kalender", "calendário", "日历", "カレンダー", "일정", "takvim"], action: "navigate", tab: "tool-ai-calendar", response: "Opening AI Calendar." },
    { keywords: ["adjust booking", "move booking", "reschedule", "change date", "postpone", "بکنگ تبدیل", "reprogramar", "reporter", "verschieben", "remarcar", "改期", "予約変更", "예약 변경", "erteleme"], action: "navigate", tab: "tool-ai-calendar", response: "Opening AI Calendar for booking adjustments." },
    { keywords: ["new booking", "add booking", "create booking", "book now", "نئی بکنگ", "nueva reserva", "nouvelle réservation", "neue buchung", "nova reserva", "新预订", "新規予約", "새 예약", "yeni rezervasyon"], action: "navigate", tab: "tool-manual-booking", response: "Opening Manual Booking." },
    { keywords: ["optimize schedule", "auto schedule", "smart schedule"], action: "navigate", tab: "tool-ai-calendar", response: "Running AI schedule optimization — filling gaps and resolving conflicts." },
    { keywords: ["today's schedule", "show today", "today schedule", "آج کا شیڈول"], action: "navigate", tab: "tool-ai-calendar", response: "Opening today's schedule view." },
    { keywords: ["find available", "available slots", "open slots", "خالی سلاٹ"], action: "navigate", tab: "tool-ai-calendar", response: "Searching for available time slots." },
    { keywords: ["check conflicts", "double booking", "conflict check", "ڈبل بکنگ"], action: "navigate", tab: "tool-ai-calendar", response: "Running double-booking guard — checking for conflicts." },
    // ── AI Pricing commands (universal for pricing industries) ──
    { keywords: ["optimize prices", "optimize pricing", "price optimization", "قیمت بہتر"], action: "navigate", tab: "tool-ai-pricing", response: "Running AI Price Optimization engine." },
    { keywords: ["demand forecast", "show demand", "demand prediction", "مانگ کی پیشگوئی"], action: "navigate", tab: "tool-ai-pricing", response: "Opening demand forecast view." },
    { keywords: ["compare competitors", "competitor pricing", "مسابقتی قیمتیں"], action: "navigate", tab: "competitor-intel", response: "Opening competitor pricing comparison." },
    { keywords: ["surge pricing", "peak pricing", "high demand pricing"], action: "navigate", tab: "tool-ai-pricing", response: "Activating surge pricing for peak demand periods." },
    { keywords: ["discount suggestion", "suggest discount", "low demand discount", "رعایت تجویز"], action: "navigate", tab: "tool-ai-pricing", response: "AI is analyzing low-demand periods for discount suggestions." },
    { keywords: ["revenue maximizer", "maximize revenue", "max revenue", "زیادہ سے زیادہ آمدنی"], action: "navigate", tab: "tool-ai-pricing", response: "Running full AI Revenue Maximizer — optimizing all pricing." },
  ];

  // Industry-specific commands
  const industrySpecific: Record<string, VoiceCommand[]> = {
    airlines: [
      { keywords: ["flight ops", "flight operations", "flights", "flight schedule"], action: "navigate", tab: "flight-ops", response: "Opening Flight Operations." },
      { keywords: ["pricing", "price", "ticket price", "fare"], action: "navigate", tab: "tool-ai-pricing", response: "Opening AI Ticket Pricing." },
      { keywords: ["delay", "disruption", "cancelled", "delayed flight"], action: "navigate", tab: "tickets", response: "Opening Complaints for disruptions." },
      { keywords: ["crew", "pilot", "staff scheduling", "crew schedule"], action: "navigate", tab: "tool-ai-scheduling", response: "Opening AI Scheduling for crew rotation." },
      { keywords: ["route", "routes", "destinations"], action: "navigate", tab: "tool-route-optimizer", response: "Opening Route Optimizer." },
      { keywords: ["capacity", "load factor", "seats"], action: "navigate", tab: "tool-capacity-planner", response: "Opening Capacity Planner." },
      { keywords: ["fill gaps", "gap filler", "empty seats"], action: "navigate", tab: "tool-ai-calendar", response: "AI is finding gap-fill opportunities for flights." },
    ],
    hospitality: [
      { keywords: ["pricing", "price", "room rate", "rates"], action: "navigate", tab: "tool-ai-pricing", response: "Opening AI Room Pricing." },
      { keywords: ["rooms", "resources", "property"], action: "navigate", tab: "tool-resource-mgmt", response: "Opening Resource Manager." },
      { keywords: ["check in", "check out", "reservation"], action: "navigate", tab: "tool-manual-booking", response: "Opening Reservations." },
      { keywords: ["fill gaps", "gap night", "empty nights"], action: "navigate", tab: "tool-ai-calendar", response: "AI is finding gap-night filler opportunities." },
    ],
    car_rental: [
      { keywords: ["fleet", "vehicles", "cars"], action: "navigate", tab: "tool-fleet-mgmt", response: "Opening Fleet Manager." },
      { keywords: ["pricing", "rental price", "rates"], action: "navigate", tab: "tool-ai-pricing", response: "Opening AI Rental Pricing." },
    ],
    healthcare: [
      { keywords: ["schedule", "appointment", "slots"], action: "navigate", tab: "tool-ai-scheduling", response: "Opening AI Scheduling." },
      { keywords: ["rooms", "equipment", "resources"], action: "navigate", tab: "tool-resource-mgmt", response: "Opening Resource Manager." },
    ],
    education: [
      { keywords: ["timetable", "classes", "schedule"], action: "navigate", tab: "tool-ai-scheduling", response: "Opening AI Scheduling." },
      { keywords: ["enrollment", "class booking"], action: "navigate", tab: "tool-manual-booking", response: "Opening Enrollment Booking." },
      { keywords: ["rooms", "labs", "resources"], action: "navigate", tab: "tool-resource-mgmt", response: "Opening Resource Manager." },
      { keywords: ["optimize timetable", "smart timetable"], action: "navigate", tab: "tool-ai-calendar", response: "AI is optimizing your class timetable." },
    ],
    logistics: [
      { keywords: ["route", "routes", "delivery"], action: "navigate", tab: "tool-route-optimizer", response: "Opening Route Optimizer." },
      { keywords: ["fleet", "vehicles", "trucks"], action: "navigate", tab: "tool-fleet-mgmt", response: "Opening Fleet Manager." },
      { keywords: ["dispatch", "shipment"], action: "navigate", tab: "tool-ai-scheduling", response: "Opening Dispatch Scheduling." },
      { keywords: ["dispatch optimization", "optimize dispatch"], action: "navigate", tab: "tool-ai-scheduling", response: "AI is optimizing delivery dispatch times." },
    ],
    events_entertainment: [
      { keywords: ["pricing", "ticket price", "rates"], action: "navigate", tab: "tool-ai-pricing", response: "Opening Event Ticket Pricing." },
      { keywords: ["venue", "capacity", "seats"], action: "navigate", tab: "tool-capacity-planner", response: "Opening Capacity Planner." },
      { keywords: ["surge pricing", "peak event pricing"], action: "navigate", tab: "tool-ai-pricing", response: "Activating surge pricing for high-demand events." },
    ],
    railways: [
      { keywords: ["pricing", "ticket price", "fare"], action: "navigate", tab: "tool-ai-pricing", response: "Opening Rail Ticket Pricing." },
      { keywords: ["route", "routes", "trains"], action: "navigate", tab: "tool-route-optimizer", response: "Opening Route Manager." },
      { keywords: ["coaches", "seats", "capacity"], action: "navigate", tab: "tool-capacity-planner", response: "Opening Capacity Planner." },
    ],
  };

  return [...universal, ...(industrySpecific[industry] || [])];
}

// ─── Generate greeting based on time + language ─────────────────────────────
function getGreetingResponse(industry: IndustryType): string {
  const config = getIndustryConfig(industry);
  const lang = (i18n.language || "en").split("-")[0];
  const g = GREETINGS[lang] || GREETINGS.en;
  const hour = new Date().getHours();

  let timeGreeting: string;
  if (hour >= 5 && hour < 12) timeGreeting = g.morning;
  else if (hour >= 12 && hour < 17) timeGreeting = g.afternoon;
  else if (hour >= 17 && hour < 21) timeGreeting = g.evening;
  else timeGreeting = g.night;

  return `${timeGreeting} ${g.intro.replace("{industry}", config.label)}`;
}

// ─── Help response ──────────────────────────────────────────────────────────
function getHelpResponse(industry: IndustryType): string {
  const crmConfig = getCrmConfig(industry);
  const hasPricing = supportsAutoPricing(industry);

  let help = `📋 "${crmConfig.contactLabelPlural}" — Open contacts\n`;
  help += `🎫 "${crmConfig.ticketLabelPlural}" — Open tickets\n`;
  help += `💼 "${crmConfig.dealLabelPlural}" — Open deals\n`;
  help += `📊 "Analytics" — Revenue reports\n`;
  help += `🤖 "AI Insights" — Predictions\n`;
  help += `✉️ "Email" — AI Email Composer\n`;
  help += `📅 "Calendar" — AI Calendar\n`;
  help += `📝 "New Booking" — Create booking\n`;

  if (hasPricing) help += `💰 "Pricing" — AI dynamic pricing\n`;

  if (industry === "airlines") {
    help += `✈️ "Flight Ops" — Operations\n`;
    help += `🗺️ "Routes" — Route optimizer\n`;
  } else if (industry === "logistics") {
    help += `🗺️ "Routes" — Delivery routes\n`;
    help += `🚚 "Fleet" — Fleet management\n`;
  } else if (industry === "car_rental") {
    help += `🚗 "Fleet" — Vehicle management\n`;
  }

  return help;
}

// ─── Text-to-Speech with female voice + language ────────────────────────────
function speakText(text: string, lang?: string) {
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();
  const clean = text.replace(/[📋🎫💼📊🤖✉️💰✈️🗺️🚚🚗💡📅📝\n]/g, " ").replace(/\s+/g, " ").trim();
  const utterance = new SpeechSynthesisUtterance(clean);

  const speechLang = lang || getSpeechLang();
  utterance.lang = speechLang;

  // Find a female voice matching the language
  const voices = window.speechSynthesis.getVoices();
  const langPrefix = speechLang.split("-")[0];

  const femaleVoice = voices.find(v =>
    v.lang.startsWith(langPrefix) && /female|samantha|victoria|karen|moira|fiona|tessa|zira|hazel/i.test(v.name)
  ) || voices.find(v =>
    v.lang.startsWith(langPrefix) && !/male/i.test(v.name)
  ) || voices.find(v =>
    v.lang.startsWith(langPrefix)
  ) || voices[0];

  if (femaleVoice) utterance.voice = femaleVoice;
  utterance.rate = 1.0;
  utterance.pitch = 1.15;
  utterance.volume = 1;

  window.speechSynthesis.speak(utterance);
}

// ─── Speech Recognition with language support ───────────────────────────────
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
    recognition.lang = getSpeechLang(); // Use current i18n language

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
  const conversationMemory = useRef<string[]>([]); // Contextual memory - last 5 exchanges

  const commands = getIndustryCommands(industry);

  // Load voices (some browsers load async)
  useEffect(() => {
    window.speechSynthesis?.getVoices();
    const handleVoicesChanged = () => window.speechSynthesis?.getVoices();
    window.speechSynthesis?.addEventListener?.("voiceschanged", handleVoicesChanged);
    return () => window.speechSynthesis?.removeEventListener?.("voiceschanged", handleVoicesChanged);
  }, []);

  // Auto-scroll
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
      const config = getIndustryConfig(industry);
      if (lower.includes("how are you") || lower.includes("how do you do") || lower.includes("کیسی ہو") || lower.includes("कैसी हो")) {
        aiResponse = `I'm great! How can I help you with ${config.label}?`;
      } else {
        aiResponse = `I heard "${userText}". Try saying "help" to see my commands.`;
      }
    }

    setMessages(prev => [...prev, {
      role: "ai",
      text: aiResponse,
      timestamp: new Date(),
      action: matched?.tab ? `→ ${matched.tab}` : undefined,
    }]);

    // Only speak when responding to a command (not auto)
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

  // Open panel — show greeting text only, NO auto-speak
  const handleOpen = useCallback(() => {
    setShowPanel(true);
    if (!hasGreeted.current) {
      hasGreeted.current = true;
      const greeting = getGreetingResponse(industry);
      setMessages([{ role: "ai", text: greeting, timestamp: new Date() }]);
      // NO speakText here — only speak when user gives a command
    }
  }, [industry]);

  // Floating mic button
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
        {/* Header */}
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
                {isListening ? "🎙️ Speak now..." : isSpeaking ? "🔊 Aria is speaking..." : "Tap mic to speak"}
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
              {["Help", getCrmConfig(industry).contactLabelPlural, "Analytics", "Calendar"].map(hint => (
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
