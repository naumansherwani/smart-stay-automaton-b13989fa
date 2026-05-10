import { Workflow, Construction } from "lucide-react";

export default function Automations() {
  return (
    <div className="container max-w-6xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Workflow className="w-7 h-7 text-primary" /> Automations
        </h1>
        <p className="text-muted-foreground mt-1.5">Smart Pricing, AI Calendar, real-time Brain stream — your background workforce.</p>
      </div>
      <div className="p-12 text-center rounded-2xl bg-card/40 backdrop-blur-xl border border-border/50">
        <Construction className="w-10 h-10 text-primary mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Workflow builder coming soon. Smart Pricing & AI Calendar are already running in the background.</p>
      </div>
    </div>
  );
}