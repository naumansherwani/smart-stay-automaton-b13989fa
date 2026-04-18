import Logo from "@/components/Logo";
import { Mail, Linkedin, Facebook, Sparkles, Brain, Star, Building2, Zap } from "lucide-react";

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const SOCIAL_LINKS = [
  { href: "mailto:contact@hostflowai.live", icon: Mail, label: "contact@hostflowai.live" },
  { href: "https://instagram.com/hostflowai", icon: InstagramIcon, label: "Instagram" },
  { href: "https://wa.me/923001234567", icon: WhatsAppIcon, label: "WhatsApp" },
  { href: "https://facebook.com/hostflowai", icon: Facebook, label: "Facebook" },
  { href: "https://x.com/hostflowai", icon: XIcon, label: "X (Twitter)" },
  { href: "https://linkedin.com/company/hostflowai", icon: Linkedin, label: "LinkedIn" },
];

const Footer = () => (
  <footer className="py-16 relative overflow-hidden">
    <div className="absolute inset-0 bg-[hsl(222,47%,6%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,hsl(174,62%,50%,0.03),transparent_60%)]" />
    
    <div className="container relative z-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        <div className="space-y-4">
          <Logo size="md" showName />
          <p className="text-sm text-white/40 leading-relaxed">
            AI-powered scheduling & booking platform built for 8 industries. Smarter calendars, zero conflicts, maximum revenue.
          </p>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-bold uppercase tracking-wider text-white/80">Product</h4>
          <ul className="space-y-2.5">
            {[
              { href: "#features", label: "Features" },
              { href: "#pricing", label: "Pricing" },
              { href: "/crm", label: "AI CRM" },
              { href: "/reviews", label: "Reviews" },
              { href: "#industries", label: "Industries" },
            ].map(link => (
              <li key={link.label}>
                <a href={link.href} className="text-sm text-white/40 hover:text-[hsl(174,62%,50%)] transition-colors duration-300">{link.label}</a>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-bold uppercase tracking-wider text-white/80">Legal</h4>
          <ul className="space-y-2.5">
            {[
              { href: "/privacy", label: "Privacy Policy" },
              { href: "/terms", label: "Terms & Conditions" },
              { href: "/refund-policy", label: "Refund Policy" },
              { href: "/about", label: "About Us" },
              { href: "/contact", label: "Contact" },
            ].map(link => (
              <li key={link.label}>
                <a href={link.href} className="text-sm text-white/40 hover:text-[hsl(174,62%,50%)] transition-colors duration-300">{link.label}</a>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-bold uppercase tracking-wider text-white/80">Connect</h4>
          <ul className="space-y-2.5">
            {SOCIAL_LINKS.map(s => (
              <li key={s.label}>
                <a href={s.href} target={s.href.startsWith("mailto") ? undefined : "_blank"} rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-white/40 hover:text-[hsl(174,62%,50%)] transition-colors duration-300">
                  <s.icon className="w-4 h-4" /> {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Why HostFlow AI — differentiators */}
      <div className="mt-16 pt-10 border-t border-white/[0.06]">
        <div className="text-center mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[hsl(174,62%,50%,0.12)] to-[hsl(217,91%,60%,0.12)] border border-[hsl(174,62%,50%,0.25)]">
            <Sparkles className="w-3.5 h-3.5 text-[hsl(174,62%,55%)]" />
            <span className="text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-[hsl(174,62%,60%)] to-[hsl(217,91%,65%)] bg-clip-text text-transparent">
              Why HostFlow AI is different
            </span>
          </div>
          <h3 className="text-2xl md:text-3xl font-extrabold text-white">
            The only platform built to <span className="bg-gradient-to-r from-[hsl(174,62%,55%)] to-[hsl(217,91%,65%)] bg-clip-text text-transparent">replace 6 SaaS tools</span> with one.
          </h3>
          <p className="text-sm text-white/50 max-w-2xl mx-auto leading-relaxed">
            While other platforms force you to stitch together a calendar, a CRM, a pricing engine and a review tool — HostFlow AI delivers all of it, natively unified, with industry-trained AI at the core.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
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
              body: "Our CRM doesn’t just store contacts — it scores leads, predicts churn, drafts follow-ups, and runs daily plans tailored to your industry. Salesforce-grade intelligence, zero setup.",
            },
            {
              icon: Star,
              title: "Reviews",
              tagline: "AI-filtered. Trust-building.",
              body: "Genuine reviews, AI-moderated for spam and bias, embedded across your booking funnel — turning every happy guest into a measurable conversion lever.",
            },
            {
              icon: Building2,
              title: "Industries",
              tagline: "Built for 8 verticals.",
              body: "Hospitality, Airlines, Car Rental, Logistics, Healthcare, Education, Events, Railways — each with industry-trained AI models, KPIs, and workflows. No generic templates.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="group relative rounded-xl p-5 bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/[0.06] hover:border-[hsl(174,62%,50%,0.4)] hover:bg-white/[0.04] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_-12px_hsl(174,62%,50%,0.3)]"
            >
              <div className="inline-flex w-9 h-9 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(174,62%,50%,0.15)] to-[hsl(217,91%,60%,0.15)] border border-[hsl(174,62%,50%,0.25)] mb-3">
                <item.icon className="w-4 h-4 text-[hsl(174,62%,60%)]" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">{item.title}</h4>
              <p className="text-[11px] font-semibold uppercase tracking-wider bg-gradient-to-r from-[hsl(174,62%,60%)] to-[hsl(217,91%,65%)] bg-clip-text text-transparent mb-2">
                {item.tagline}
              </p>
              <p className="text-xs text-white/50 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-white/40 italic mt-8 max-w-3xl mx-auto">
          Where competitors sell software, HostFlow AI delivers an autonomous operating layer for your business — designed, trained and continuously refined to outperform every legacy SaaS in its category.
        </p>
      </div>

      <div className="mt-14 pt-6 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-3">
        <p className="text-xs text-white/30">© 2026 HostFlow AI Technologies. All rights reserved.</p>
        <p className="text-xs text-white/30">Powered by AI · Built for every industry · Made with ❤️</p>
      </div>
    </div>
  </footer>
);

export default Footer;
