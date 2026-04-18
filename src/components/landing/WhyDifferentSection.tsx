import { Sparkles, Brain, Star, Building2, Zap } from "lucide-react";

const ITEMS = [
  {
    icon: Zap,
    title: "Features",
    tagline: "One platform. Six products.",
    body: "Most SaaS gives you a single tool. We deliver an entire intelligent operations stack — calendar, CRM, pricing, reviews, ticketing and analytics — engineered to work as one.",
  },
  {
    icon: Sparkles,
    title: "Pricing",
    tagline: "Transparent. Trial-first.",
    body: "No hidden fees, no annual lock-ins, no per-seat tax. Start with a 7-day full-access trial — no credit card — and only pay when HostFlow proves its ROI.",
  },
  {
    icon: Brain,
    title: "AI CRM",
    tagline: "Predictive, not reactive.",
    body: "Our CRM doesn't just store contacts — it scores leads, predicts churn, drafts follow-ups, and runs daily plans tailored to your industry. Salesforce-grade intelligence, zero setup.",
  },
  {
    icon: Star,
    title: "Reviews",
    tagline: "Real voices. Real impact.",
    body: "Showcase authentic feedback from your customers right inside your booking flow — building instant trust and turning every great experience into your strongest sales asset.",
  },
  {
    icon: Building2,
    title: "Industries",
    tagline: "Built for 8 verticals.",
    body: "Hospitality, Airlines, Car Rental, Logistics, Healthcare, Education, Events, Railways — each with industry-trained AI models, KPIs, and workflows. No generic templates.",
  },
];

const WhyDifferentSection = () => (
  <section className="py-20 relative overflow-hidden bg-[hsl(222,47%,6%)]">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(174,62%,50%,0.05),transparent_60%)]" />

    <div className="container relative z-10">
      <div className="text-center mb-12 space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[hsl(174,62%,50%,0.12)] to-[hsl(217,91%,60%,0.12)] border border-[hsl(174,62%,50%,0.25)]">
          <Sparkles className="w-3.5 h-3.5 text-[hsl(174,62%,55%)]" />
          <span className="text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-[hsl(174,62%,60%)] to-[hsl(217,91%,65%)] bg-clip-text text-transparent">
            Why HostFlow AI is different
          </span>
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-white">
          The only platform built to{" "}
          <span className="bg-gradient-to-r from-[hsl(174,62%,55%)] to-[hsl(217,91%,65%)] bg-clip-text text-transparent">
            replace 6 SaaS tools
          </span>{" "}
          with one.
        </h2>
        <p className="text-base text-white/50 max-w-2xl mx-auto leading-relaxed">
          While other platforms force you to stitch together a calendar, a CRM, a pricing engine and a review tool — HostFlow AI delivers all of it, natively unified, with industry-trained AI at the core.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 max-w-7xl mx-auto">
        {ITEMS.map((item) => (
          <div
            key={item.title}
            className="group relative rounded-xl p-5 bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/[0.06] hover:border-[hsl(174,62%,50%,0.4)] hover:bg-white/[0.04] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_-12px_hsl(174,62%,50%,0.3)]"
          >
            <div className="inline-flex w-10 h-10 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(174,62%,50%,0.15)] to-[hsl(217,91%,60%,0.15)] border border-[hsl(174,62%,50%,0.25)] mb-3">
              <item.icon className="w-4 h-4 text-[hsl(174,62%,60%)]" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">{item.title}</h3>
            <p className="text-[11px] font-semibold uppercase tracking-wider bg-gradient-to-r from-[hsl(174,62%,60%)] to-[hsl(217,91%,65%)] bg-clip-text text-transparent mb-2">
              {item.tagline}
            </p>
            <p className="text-xs text-white/50 leading-relaxed">{item.body}</p>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-white/40 italic mt-10 max-w-3xl mx-auto">
        Where competitors sell software, HostFlow AI delivers an autonomous operating layer for your business — designed, trained and continuously refined to outperform every legacy SaaS in its category.
      </p>
    </div>
  </section>
);

export default WhyDifferentSection;
