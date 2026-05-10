import { LifeBuoy } from "lucide-react";

export default function Support() {
  return (
    <div className="container max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <LifeBuoy className="w-7 h-7 text-primary" /> Support
        </h1>
        <p className="text-muted-foreground mt-1.5">Need help? Your industry advisor is the fastest path. Founder-level escalation goes to Sherlock.</p>
      </div>
      <div className="p-6 rounded-2xl bg-card/40 backdrop-blur-xl border border-border/50 space-y-3">
        <p className="text-sm">For technical or billing questions, the on-screen AI assistant can resolve most issues in under a minute. For anything urgent, your industry advisor will auto-escalate to Sherlock if needed.</p>
        <p className="text-xs text-muted-foreground">Critical incidents → AI Resolution Hub tracks live progress with countdown and revenue protection.</p>
      </div>
    </div>
  );
}