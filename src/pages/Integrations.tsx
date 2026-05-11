import { Plug, MessageCircle, Mic } from "lucide-react";
import AppLayout from "@/components/app/AppLayout";

export default function Integrations() {
  const items = [
    { icon: Plug, name: "OTA Channels", desc: "Booking.com, Airbnb, Expedia, TripAdvisor — hospitality only.", status: "Configure in Settings" },
    { icon: MessageCircle, name: "WhatsApp", desc: "Connect your number to chat with leads & customers via WhatsApp.", status: "Coming soon" },
    { icon: Mic, name: "Voice (ElevenLabs)", desc: "Industry-specific advisor welcome audio + voice replies.", status: "Active" },
  ];
  return (
    <AppLayout>
    <div className="container max-w-6xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Plug className="w-7 h-7 text-primary" /> Integrations
        </h1>
        <p className="text-muted-foreground mt-1.5">Connect HostFlow AI to the channels your business already runs on.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((i) => (
          <div key={i.name} className="p-5 rounded-2xl bg-card/40 backdrop-blur-xl border border-border/50">
            <i.icon className="w-6 h-6 text-primary mb-3" />
            <h3 className="font-bold">{i.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">{i.desc}</p>
            <p className="text-[10px] uppercase tracking-wider text-primary mt-3">{i.status}</p>
          </div>
        ))}
      </div>
    </div>
    </AppLayout>
  );
}